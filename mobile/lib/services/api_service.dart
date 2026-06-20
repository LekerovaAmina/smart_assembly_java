import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/user.dart';
import '../models/event.dart';
import '../models/attendance.dart';

class ApiService {
  static const String _tokenKey = 'jwt_token';
  String? _token;

  Future<String?> getToken() async {
    _token ??= await _getStoredToken();
    return _token;
  }

  Future<String?> _getStoredToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<void> saveToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> logout() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  Map<String, String> _getHeaders() {
    final headers = {'Content-Type': 'application/json'};
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  Future<Map<String, dynamic>> sendOtp(String phone) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConfig.getFullUrl(ApiConfig.loginEndpoint)),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phone': phone}),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        final body = _tryDecodeBody(response.body);
        throw Exception(body['message'] ?? 'Ошибка отправки OTP: ${response.statusCode}');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Ошибка подключения: $e');
    }
  }

  Future<Map<String, dynamic>> verifyOtp(String phone, String otp) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConfig.getFullUrl(ApiConfig.verifyOtpEndpoint)),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phone': phone, 'otp': otp}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        if (data['token'] != null) {
          await saveToken(data['token'] as String);
        }
        return data;
      } else {
        final body = _tryDecodeBody(response.body);
        throw Exception(body['message'] ?? 'Неверный код: ${response.statusCode}');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Ошибка верификации: $e');
    }
  }

  Future<User> getMe() async {
    await _ensureToken();
    try {
      final response = await http.get(
        Uri.parse(ApiConfig.getFullUrl(ApiConfig.meEndpoint)),
        headers: _getHeaders(),
      );

      if (response.statusCode == 200) {
        return User.fromJson(jsonDecode(response.body));
      } else if (response.statusCode == 401) {
        await logout();
        throw Exception('Сессия истекла. Войдите снова.');
      } else {
        throw Exception('Ошибка загрузки профиля: ${response.statusCode}');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Ошибка получения профиля: $e');
    }
  }

  Future<List<Event>> getEvents({String? status, int page = 0, int limit = 20}) async {
    await _ensureToken();
    try {
      final params = <String, String>{
        'page': page.toString(),
        'size': limit.toString(),
      };
      if (status != null) params['status'] = status;

      final uri = Uri.parse(ApiConfig.getFullUrl(ApiConfig.eventsEndpoint))
          .replace(queryParameters: params);

      final response = await http.get(uri, headers: _getHeaders());

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Поддержка как pageable ответа, так и простого списка
        final List<dynamic> items = data is List ? data : (data['content'] as List? ?? []);
        return items.map((e) => Event.fromJson(e as Map<String, dynamic>)).toList();
      } else if (response.statusCode == 401) {
        await logout();
        throw Exception('Сессия истекла. Войдите снова.');
      } else {
        throw Exception('Ошибка загрузки мероприятий: ${response.statusCode}');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Ошибка получения мероприятий: $e');
    }
  }

  Future<Event> getEvent(int eventId) async {
    await _ensureToken();
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.getFullUrl(ApiConfig.eventsEndpoint)}/$eventId'),
        headers: _getHeaders(),
      );

      if (response.statusCode == 200) {
        return Event.fromJson(jsonDecode(response.body));
      } else if (response.statusCode == 401) {
        await logout();
        throw Exception('Сессия истекла. Войдите снова.');
      } else if (response.statusCode == 404) {
        throw Exception('Мероприятие не найдено');
      } else {
        throw Exception('Ошибка загрузки мероприятия: ${response.statusCode}');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Ошибка получения мероприятия: $e');
    }
  }

  Future<Attendance> respondToEvent(int eventId) async {
    await _ensureToken();
    try {
      final response = await http.post(
        Uri.parse(ApiConfig.getFullUrl(ApiConfig.attendanceEndpoint)),
        headers: _getHeaders(),
        body: jsonEncode({'eventId': eventId, 'status': 'INTERESTED'}),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return Attendance.fromJson(jsonDecode(response.body));
      } else if (response.statusCode == 401) {
        await logout();
        throw Exception('Сессия истекла. Войдите снова.');
      } else {
        final body = _tryDecodeBody(response.body);
        throw Exception(body['message'] ?? 'Ошибка при отклике: ${response.statusCode}');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Ошибка при отклике: $e');
    }
  }

  Future<void> cancelAttendance(int attendanceId) async {
    await _ensureToken();
    try {
      final response = await http.delete(
        Uri.parse('${ApiConfig.getFullUrl(ApiConfig.attendanceEndpoint)}/$attendanceId'),
        headers: _getHeaders(),
      );

      if (response.statusCode == 401) {
        await logout();
        throw Exception('Сессия истекла. Войдите снова.');
      } else if (response.statusCode != 200 && response.statusCode != 204) {
        throw Exception('Ошибка отмены отклика: ${response.statusCode}');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Ошибка при отмене: $e');
    }
  }

  Future<List<User>> getEventAttendees(int eventId) async {
    await _ensureToken();
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.getFullUrl(ApiConfig.eventsEndpoint)}/$eventId/attendees'),
        headers: _getHeaders(),
      );

      if (response.statusCode == 200) {
        return (jsonDecode(response.body) as List)
            .map((u) => User.fromJson(u as Map<String, dynamic>))
            .toList();
      } else if (response.statusCode == 401) {
        await logout();
        throw Exception('Сессия истекла. Войдите снова.');
      } else {
        throw Exception('Ошибка загрузки участников: ${response.statusCode}');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Ошибка получения участников: $e');
    }
  }

  Future<void> _ensureToken() async {
    final token = await getToken();
    if (token == null || token.isEmpty) {
      throw Exception('Необходима авторизация');
    }
  }

  Map<String, dynamic> _tryDecodeBody(String body) {
    try {
      return jsonDecode(body) as Map<String, dynamic>;
    } catch (_) {
      return {};
    }
  }
}
