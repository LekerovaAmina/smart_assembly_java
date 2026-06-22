import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../main.dart' show kPrimary, UserState;
import '../models/event.dart';
import '../services/api_service.dart';
import 'login_screen.dart';

class QrCheckinScreen extends StatefulWidget {
  final int eventId;
  const QrCheckinScreen({super.key, required this.eventId});

  @override
  State<QrCheckinScreen> createState() => _QrCheckinScreenState();
}

class _QrCheckinScreenState extends State<QrCheckinScreen> {
  bool _checkingAuth = true;
  bool _loggedIn = false;

  Event? _event;
  bool _loadingEvent = true;
  String? _eventError;

  bool _confirming = false;
  bool _confirmed = false;
  String? _confirmError;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final api = context.read<ApiService>();
    final loggedIn = await api.isLoggedIn();
    if (loggedIn) {
      try {
        final user = await api.getMe();
        if (mounted) context.read<UserState>().setUser(user);
      } catch (_) {}
    }
    if (mounted) {
      setState(() {
        _loggedIn = loggedIn;
        _checkingAuth = false;
      });
      if (loggedIn) _loadEvent();
    }
  }

  Future<void> _loadEvent() async {
    try {
      final event = await context.read<ApiService>().getEvent(widget.eventId);
      if (mounted) setState(() { _event = event; _loadingEvent = false; });
    } catch (e) {
      if (mounted) setState(() {
        _eventError = e.toString().replaceAll('Exception: ', '');
        _loadingEvent = false;
      });
    }
  }

  Future<void> _confirm() async {
    setState(() { _confirming = true; _confirmError = null; });
    try {
      await context.read<ApiService>().selfCheckin(widget.eventId);
      if (mounted) setState(() => _confirmed = true);
    } catch (e) {
      if (mounted) setState(() {
        _confirmError = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _confirming = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_checkingAuth) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: kPrimary)),
      );
    }

    if (!_loggedIn) {
      return LoginScreen(
        onLoginSuccess: () async {
          final api = context.read<ApiService>();
          try {
            final user = await api.getMe();
            if (mounted) context.read<UserState>().setUser(user);
          } catch (_) {}
          if (mounted) setState(() { _loggedIn = true; _loadingEvent = true; });
          _loadEvent();
        },
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        backgroundColor: kPrimary,
        title: const Text('Подтверждение',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: Colors.white),
        automaticallyImplyLeading: false,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loadingEvent) {
      return const Center(child: CircularProgressIndicator(color: kPrimary));
    }

    if (_eventError != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.error_outline, size: 56, color: Colors.red),
            const SizedBox(height: 12),
            Text(_eventError!, textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () { setState(() { _loadingEvent = true; _eventError = null; }); _loadEvent(); },
              icon: const Icon(Icons.refresh),
              label: const Text('Повторить'),
              style: ElevatedButton.styleFrom(backgroundColor: kPrimary, foregroundColor: Colors.white),
            ),
          ]),
        ),
      );
    }

    final event = _event!;
    final fmt = DateFormat('dd.MM.yyyy · HH:mm', 'ru');

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Иконка и заголовок
          const SizedBox(height: 16),
          const Icon(Icons.qr_code_scanner, size: 64, color: kPrimary),
          const SizedBox(height: 16),
          const Text(
            'Подтверждение участия',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF1A1A1A)),
          ),
          const SizedBox(height: 24),

          // Карточка мероприятия
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE8E8E8)),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(event.eventName,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              Row(children: [
                const Icon(Icons.calendar_today_outlined, size: 15, color: Color(0xFF666666)),
                const SizedBox(width: 6),
                Text(fmt.format(event.startDateTime),
                    style: const TextStyle(fontSize: 14, color: Color(0xFF666666))),
              ]),
              if (event.location.isNotEmpty) ...[
                const SizedBox(height: 6),
                Row(children: [
                  const Icon(Icons.location_on_outlined, size: 15, color: Color(0xFF666666)),
                  const SizedBox(width: 6),
                  Expanded(child: Text(event.location,
                      style: const TextStyle(fontSize: 14, color: Color(0xFF666666)))),
                ]),
              ],
            ]),
          ),
          const SizedBox(height: 32),

          // Результат / кнопка
          if (_confirmed) ...[
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5E9),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFA5D6A7)),
              ),
              child: const Column(children: [
                Text('✅', style: TextStyle(fontSize: 40)),
                SizedBox(height: 12),
                Text('Присутствие подтверждено!',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold,
                        color: Color(0xFF2E7D32))),
                SizedBox(height: 6),
                Text('Ваши часы будут начислены после завершения мероприятия.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13, color: Color(0xFF388E3C))),
              ]),
            ),
          ] else ...[
            if (_confirmError != null) ...[
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFEBEE),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFEF9A9A)),
                ),
                child: Row(children: [
                  const Icon(Icons.error_outline, color: Color(0xFFC62828), size: 20),
                  const SizedBox(width: 10),
                  Expanded(child: Text(_confirmError!,
                      style: const TextStyle(color: Color(0xFFC62828), fontSize: 13))),
                ]),
              ),
            ],
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _confirming ? null : _confirm,
                icon: _confirming
                    ? const SizedBox(width: 18, height: 18,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.check_circle_outline),
                label: Text(_confirming ? 'Подтверждаем...' : 'Подтвердить присутствие',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: kPrimary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Нажмите кнопку, чтобы зафиксировать ваш приход на мероприятие.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: Color(0xFF999999)),
            ),
          ],
        ],
      ),
    );
  }
}
