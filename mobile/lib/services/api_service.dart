import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/user.dart';
import '../models/event.dart';
import '../models/attendee.dart';
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

  Map<String, String> _authHeaders() {
    final h = {'Content-Type': 'application/json'};
    if (_token != null) h['Authorization'] = 'Bearer $_token';
    return h;
  }

  Future<void> _ensureToken() async {
    final token = await getToken();
    if (token == null || token.isEmpty) throw Exception('Необходима авторизация');
  }

  Map<String, dynamic> _tryDecode(String body) {
    try {
      return jsonDecode(body) as Map<String, dynamic>;
    } catch (_) {
      return {};
    }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> sendOtp(String phone) async {
    final res = await http.post(
      Uri.parse(ApiConfig.getFullUrl(ApiConfig.loginEndpoint)),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone}),
    );
    if (res.statusCode == 200 || res.statusCode == 201) {
      return jsonDecode(res.body);
    }
    throw Exception(_tryDecode(res.body)['message'] ?? 'Ошибка отправки OTP');
  }

  Future<Map<String, dynamic>> verifyOtp(String phone, String otp) async {
    final res = await http.post(
      Uri.parse(ApiConfig.getFullUrl(ApiConfig.verifyOtpEndpoint)),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone, 'code': otp}),
    );
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      if (data['token'] != null) await saveToken(data['token'] as String);
      return data;
    }
    throw Exception(_tryDecode(res.body)['message'] ?? 'Неверный код');
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  Future<User> getMe() async {
    await _ensureToken();
    final res = await http.get(
      Uri.parse(ApiConfig.getFullUrl(ApiConfig.meEndpoint)),
      headers: _authHeaders(),
    );
    if (res.statusCode == 200) return User.fromJson(jsonDecode(res.body));
    if (res.statusCode == 401) { await logout(); throw Exception('Сессия истекла'); }
    throw Exception('Ошибка загрузки профиля: ${res.statusCode}');
  }

  // ── Events (volunteer) ────────────────────────────────────────────────────

  Future<List<Event>> getEvents() async {
    await _ensureToken();
    final res = await http.get(
      Uri.parse(ApiConfig.getFullUrl(ApiConfig.eventsEndpoint)),
      headers: _authHeaders(),
    );
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      final List<dynamic> items =
          data is List ? data : (data['content'] as List? ?? []);
      return items.map((e) => Event.fromJson(e as Map<String, dynamic>)).toList();
    }
    if (res.statusCode == 401) { await logout(); throw Exception('Сессия истекла'); }
    throw Exception('Ошибка загрузки мероприятий: ${res.statusCode}');
  }

  // ── Events (HR) ───────────────────────────────────────────────────────────

  Future<List<Event>> getHrEvents() async {
    await _ensureToken();
    final res = await http.get(
      Uri.parse(ApiConfig.getFullUrl('${ApiConfig.eventsEndpoint}/hr')),
      headers: _authHeaders(),
    );
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      final List<dynamic> items =
          data is List ? data : (data['content'] as List? ?? []);
      return items.map((e) => Event.fromJson(e as Map<String, dynamic>)).toList();
    }
    if (res.statusCode == 401) { await logout(); throw Exception('Сессия истекла'); }
    throw Exception('Ошибка загрузки мероприятий HR: ${res.statusCode}');
  }

  Future<Event> getEvent(int eventId) async {
    await _ensureToken();
    final res = await http.get(
      Uri.parse('${ApiConfig.getFullUrl(ApiConfig.eventsEndpoint)}/$eventId'),
      headers: _authHeaders(),
    );
    if (res.statusCode == 200) return Event.fromJson(jsonDecode(res.body));
    if (res.statusCode == 401) { await logout(); throw Exception('Сессия истекла'); }
    if (res.statusCode == 404) throw Exception('Мероприятие не найдено');
    throw Exception('Ошибка: ${res.statusCode}');
  }

  Future<Event> createEvent(Map<String, dynamic> data) async {
    await _ensureToken();
    final res = await http.post(
      Uri.parse(ApiConfig.getFullUrl(ApiConfig.eventsEndpoint)),
      headers: _authHeaders(),
      body: jsonEncode(data),
    );
    if (res.statusCode == 200 || res.statusCode == 201) {
      return Event.fromJson(jsonDecode(res.body));
    }
    if (res.statusCode == 401) { await logout(); throw Exception('Сессия истекла'); }
    throw Exception(_tryDecode(res.body)['message'] ?? 'Ошибка создания: ${res.statusCode}');
  }

  Future<Event> updateEvent(int eventId, Map<String, dynamic> data) async {
    await _ensureToken();
    final res = await http.put(
      Uri.parse('${ApiConfig.getFullUrl(ApiConfig.eventsEndpoint)}/$eventId'),
      headers: _authHeaders(),
      body: jsonEncode(data),
    );
    if (res.statusCode == 200) return Event.fromJson(jsonDecode(res.body));
    if (res.statusCode == 401) { await logout(); throw Exception('Сессия истекла'); }
    throw Exception(_tryDecode(res.body)['message'] ?? 'Ошибка обновления: ${res.statusCode}');
  }

  Future<void> publishEvent(int eventId) async {
    await _ensureToken();
    final res = await http.post(
      Uri.parse('${ApiConfig.getFullUrl(ApiConfig.eventsEndpoint)}/$eventId/publish'),
      headers: _authHeaders(),
    );
    if (res.statusCode == 401) { await logout(); throw Exception('Сессия истекла'); }
    if (res.statusCode != 200 && res.statusCode != 201) {
      throw Exception(_tryDecode(res.body)['message'] ?? 'Ошибка публикации: ${res.statusCode}');
    }
  }

  Future<void> deleteEvent(int eventId) async {
    await _ensureToken();
    final res = await http.delete(
      Uri.parse('${ApiConfig.getFullUrl(ApiConfig.eventsEndpoint)}/$eventId'),
      headers: _authHeaders(),
    );
    if (res.statusCode == 401) { await logout(); throw Exception('Сессия истекла'); }
    if (res.statusCode != 200 && res.statusCode != 204) {
      throw Exception('Ошибка удаления: ${res.statusCode}');
    }
  }

  Future<Map<String, dynamic>> completeEvent(int eventId) async {
    await _ensureToken();
    final res = await http.post(
      Uri.parse('${ApiConfig.getFullUrl(ApiConfig.eventsEndpoint)}/$eventId/complete'),
      headers: _authHeaders(),
    );
    if (res.statusCode == 200 || res.statusCode == 201) {
      return _tryDecode(res.body);
    }
    if (res.statusCode == 401) { await logout(); throw Exception('Сессия истекла'); }
    throw Exception(_tryDecode(res.body)['message'] ?? 'Ошибка завершения: ${res.statusCode}');
  }

  Future<String> getEventQr(int eventId) async {
    await _ensureToken();
    final res = await http.get(
      Uri.parse('${ApiConfig.getFullUrl(ApiConfig.eventsEndpoint)}/$eventId/qr'),
      headers: _authHeaders(),
    );
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      return data['qrBase64'] as String? ?? '';
    }
    if (res.statusCode == 401) { await logout(); throw Exception('Сессия истекла'); }
    throw Exception('Ошибка загрузки QR: ${res.statusCode}');
  }

  // ── Event registration ────────────────────────────────────────────────────

  Future<void> registerEvent(int eventId) async {
    await _ensureToken();
    final res = await http.post(
      Uri.parse('${ApiConfig.getFullUrl(ApiConfig.eventsEndpoint)}/$eventId/register'),
      headers: _authHeaders(),
    );
    if (res.statusCode == 401) { await logout(); throw Exception('Сессия истекла'); }
    if (res.statusCode != 200 && res.statusCode != 201) {
      throw Exception(_tryDecode(res.body)['message'] ?? 'Ошибка регистрации: ${res.statusCode}');
    }
  }

  Future<void> unregisterEvent(int eventId) async {
    await _ensureToken();
    final res = await http.delete(
      Uri.parse('${ApiConfig.getFullUrl(ApiConfig.eventsEndpoint)}/$eventId/register'),
      headers: _authHeaders(),
    );
    if (res.statusCode == 401) { await logout(); throw Exception('Сессия истекла'); }
    if (res.statusCode != 200 && res.statusCode != 204) {
      throw Exception('Ошибка отмены: ${res.statusCode}');
    }
  }

  // ── Attendees ─────────────────────────────────────────────────────────────

  Future<List<Attendee>> getAttendees(int eventId) async {
    await _ensureToken();
    final res = await http.get(
      Uri.parse('${ApiConfig.getFullUrl(ApiConfig.eventsEndpoint)}/$eventId/attendees'),
      headers: _authHeaders(),
    );
    if (res.statusCode == 200) {
      return (jsonDecode(res.body) as List)
          .map((a) => Attendee.fromJson(a as Map<String, dynamic>))
          .toList();
    }
    if (res.statusCode == 401) { await logout(); throw Exception('Сессия истекла'); }
    throw Exception('Ошибка загрузки участников: ${res.statusCode}');
  }

  Future<void> updateAttendeeHours(
    int eventId,
    int userId,
    Map<String, dynamic> data,
  ) async {
    await _ensureToken();
    final res = await http.patch(
      Uri.parse(
          '${ApiConfig.getFullUrl(ApiConfig.eventsEndpoint)}/$eventId/attendees/$userId/hours'),
      headers: _authHeaders(),
      body: jsonEncode(data),
    );
    if (res.statusCode == 401) { await logout(); throw Exception('Сессия истекла'); }
    if (res.statusCode != 200) {
      throw Exception(_tryDecode(res.body)['message'] ?? 'Ошибка сохранения: ${res.statusCode}');
    }
  }

  Future<void> checkinUser(int eventId, int userId) async {
    await _ensureToken();
    final res = await http.post(
      Uri.parse('${ApiConfig.getFullUrl(ApiConfig.eventsEndpoint)}/$eventId/checkin'),
      headers: _authHeaders(),
      body: jsonEncode({'userId': userId}),
    );
    if (res.statusCode == 401) { await logout(); throw Exception('Сессия истекла'); }
    if (res.statusCode != 200 && res.statusCode != 201) {
      throw Exception(_tryDecode(res.body)['message'] ?? 'Ошибка чекина: ${res.statusCode}');
    }
  }

  // ── Legacy respond/cancel (kept for compatibility) ────────────────────────

  Future<Attendance> respondToEvent(int eventId) async {
    await _ensureToken();
    final res = await http.post(
      Uri.parse(ApiConfig.getFullUrl(ApiConfig.attendanceEndpoint)),
      headers: _authHeaders(),
      body: jsonEncode({'eventId': eventId, 'status': 'INTERESTED'}),
    );
    if (res.statusCode == 200 || res.statusCode == 201) {
      return Attendance.fromJson(jsonDecode(res.body));
    }
    if (res.statusCode == 401) { await logout(); throw Exception('Сессия истекла'); }
    throw Exception(_tryDecode(res.body)['message'] ?? 'Ошибка: ${res.statusCode}');
  }

  Future<void> cancelAttendance(int attendanceId) async {
    await _ensureToken();
    final res = await http.delete(
      Uri.parse('${ApiConfig.getFullUrl(ApiConfig.attendanceEndpoint)}/$attendanceId'),
      headers: _authHeaders(),
    );
    if (res.statusCode == 401) { await logout(); throw Exception('Сессия истекла'); }
    if (res.statusCode != 200 && res.statusCode != 204) {
      throw Exception('Ошибка отмены: ${res.statusCode}');
    }
  }
}
