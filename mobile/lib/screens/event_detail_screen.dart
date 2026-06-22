import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../main.dart' show kPrimary, UserState;
import '../models/event.dart';
import '../models/attendee.dart';
import '../services/api_service.dart';
import 'event_edit_screen.dart';

class EventDetailScreen extends StatefulWidget {
  final int eventId;

  const EventDetailScreen({super.key, required this.eventId});

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  Event? _event;
  bool _loading = true;
  bool _actionLoading = false;
  String? _error;
  String? _completeMsg;

  // HR participants
  List<Attendee> _attendees = [];
  bool _showAttendees = false;
  bool _attendeesLoading = false;

  // QR
  String? _qrBase64;
  bool _showQr = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  bool get _isHr => context.read<UserState>().isHr;

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = context.read<ApiService>();
      final event = await api.getEvent(widget.eventId);
      setState(() {
        _event = event;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<void> _loadAttendees() async {
    setState(() => _attendeesLoading = true);
    try {
      final api = context.read<ApiService>();
      final list = await api.getAttendees(widget.eventId);
      setState(() {
        _attendees = list;
        _attendeesLoading = false;
      });
    } catch (_) {
      setState(() {
        _attendees = [];
        _attendeesLoading = false;
      });
    }
  }

  Future<void> _handleRegister() async {
    setState(() => _actionLoading = true);
    try {
      final api = context.read<ApiService>();
      final isReg = _event?.isRegistered ?? false;
      if (isReg) {
        await api.unregisterEvent(widget.eventId);
      } else {
        await api.registerEvent(widget.eventId);
      }
      await _load();
    } catch (e) {
      _snack(e.toString().replaceAll('Exception: ', ''), success: false);
    } finally {
      if (mounted) setState(() => _actionLoading = false);
    }
  }

  Future<void> _handlePublish() async {
    final ok = await _confirm('Опубликовать это мероприятие?');
    if (!ok) return;
    setState(() => _actionLoading = true);
    try {
      await context.read<ApiService>().publishEvent(widget.eventId);
      await _load();
      _snack('Мероприятие опубликовано!', success: true);
    } catch (e) {
      _snack(e.toString().replaceAll('Exception: ', ''), success: false);
    } finally {
      if (mounted) setState(() => _actionLoading = false);
    }
  }

  Future<void> _handleDelete() async {
    final ok =
        await _confirm('Удалить черновик безвозвратно?', destructive: true);
    if (!ok) return;
    setState(() => _actionLoading = true);
    try {
      await context.read<ApiService>().deleteEvent(widget.eventId);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      _snack(e.toString().replaceAll('Exception: ', ''), success: false);
      if (mounted) setState(() => _actionLoading = false);
    }
  }

  Future<void> _handleComplete() async {
    final ok = await _confirm(
      'Завершить мероприятие и начислить часы всем участникам?\nЭто действие необратимо.',
      destructive: false,
    );
    if (!ok) return;
    setState(() {
      _actionLoading = true;
      _completeMsg = null;
    });
    try {
      final res =
          await context.read<ApiService>().completeEvent(widget.eventId);
      final msg = res['message'] as String? ?? 'Завершено';
      final processed = res['attendeesProcessed'];
      setState(() {
        _completeMsg =
            '✅ $msg${processed != null ? ' (обработано: $processed)' : ''}';
      });
      await _load();
      if (_showAttendees) await _loadAttendees();
    } catch (e) {
      setState(() {
        _completeMsg =
            '❌ ${e.toString().replaceAll('Exception: ', '')}';
      });
    } finally {
      if (mounted) setState(() => _actionLoading = false);
    }
  }

  Future<void> _loadQr() async {
    try {
      final qr =
          await context.read<ApiService>().getEventQr(widget.eventId);
      setState(() {
        _qrBase64 = qr;
        _showQr = true;
      });
    } catch (e) {
      _snack('Не удалось загрузить QR-код', success: false);
    }
  }

  void _snack(String msg, {required bool success}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: success ? kPrimary : Colors.red,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  Future<bool> _confirm(String message, {bool destructive = false}) async {
    return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Подтверждение'),
            content: Text(message),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Отмена'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(ctx, true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: destructive ? Colors.red : kPrimary,
                  foregroundColor: Colors.white,
                ),
                child: Text(destructive ? 'Удалить' : 'Подтвердить'),
              ),
            ],
          ),
        ) ??
        false;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: const Text(
          'Мероприятие',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: kPrimary,
        iconTheme: const IconThemeData(color: Colors.white),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (!_loading && _event != null && _isHr)
            IconButton(
              icon: const Icon(Icons.qr_code),
              tooltip: 'QR-код',
              onPressed: _loadQr,
            ),
        ],
      ),
      body: Stack(
        children: [
          _buildBody(),
          if (_showQr && _qrBase64 != null) _buildQrModal(),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: kPrimary));
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 56, color: Colors.red),
              const SizedBox(height: 12),
              Text(_error!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _load,
                icon: const Icon(Icons.refresh),
                label: const Text('Повторить'),
                style: ElevatedButton.styleFrom(
                    backgroundColor: kPrimary,
                    foregroundColor: Colors.white),
              ),
            ],
          ),
        ),
      );
    }
    if (_event == null) return const SizedBox.shrink();
    return _buildContent(_event!);
  }

  Widget _buildContent(Event event) {
    final fmt = DateFormat('dd.MM.yyyy · HH:mm', 'ru');

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Заголовок
          _buildHeader(event, fmt),
          const SizedBox(height: 12),

          // HR кнопки действий
          if (_isHr) ...[
            _buildHrActions(event),
            const SizedBox(height: 12),
          ],

          // Сообщение о завершении
          if (_completeMsg != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _completeMsg!.startsWith('✅')
                    ? const Color(0xFFE8F5E9)
                    : const Color(0xFFFFEBEE),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: _completeMsg!.startsWith('✅')
                      ? const Color(0xFFA5D6A7)
                      : const Color(0xFFEF9A9A),
                ),
              ),
              child: Text(
                _completeMsg!,
                style: TextStyle(
                  fontSize: 13,
                  color: _completeMsg!.startsWith('✅')
                      ? const Color(0xFF2E7D32)
                      : const Color(0xFFC62828),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Описание
          _buildDescriptionCard(event),
          const SizedBox(height: 12),

          // Спикеры
          if (event.speakers.isNotEmpty) ...[
            _buildSpeakersCard(event),
            const SizedBox(height: 12),
          ],

          // Требования
          _buildRequirementsCard(event),
          const SizedBox(height: 12),

          // Участники (HR)
          if (_isHr) ...[
            _buildAttendeesSection(),
            const SizedBox(height: 12),
          ],

          // Чекин-статус для волонтёра
          if (!_isHr && event.isRegistered) ...[
            _buildCheckinCard(event),
            const SizedBox(height: 12),
          ],

          // Кнопка для волонтёра
          if (!_isHr && event.status != 'DRAFT') ...[
            _buildVolunteerButton(event),
            const SizedBox(height: 24),
          ],
        ],
      ),
    );
  }

  Widget _buildHeader(Event event, DateFormat fmt) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE8E8E8)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Бейдж статуса
          _StatusBadge(status: event.status, label: event.statusDisplay),
          const SizedBox(height: 8),

          // Название
          Text(
            event.eventName,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A1A1A),
            ),
          ),
          const SizedBox(height: 8),

          // Дата
          Row(children: [
            const Icon(Icons.calendar_today_outlined,
                size: 15, color: Color(0xFF666666)),
            const SizedBox(width: 6),
            Text(
              fmt.format(event.startDateTime),
              style: const TextStyle(fontSize: 14, color: Color(0xFF666666)),
            ),
          ]),

          // Место
          if (event.location.isNotEmpty) ...[
            const SizedBox(height: 4),
            Row(children: [
              const Icon(Icons.location_on_outlined,
                  size: 15, color: Color(0xFF666666)),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  event.location,
                  style:
                      const TextStyle(fontSize: 14, color: Color(0xFF666666)),
                ),
              ),
            ]),
          ],
        ],
      ),
    );
  }

  Widget _buildHrActions(Event event) {
    if (event.isDraft) {
      return Row(
        children: [
          // Удалить
          Expanded(
            child: OutlinedButton(
              onPressed: _actionLoading ? null : _handleDelete,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.red,
                side: const BorderSide(color: Colors.red),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: const Text('Удалить'),
            ),
          ),
          const SizedBox(width: 8),
          // Редактировать
          Expanded(
            child: OutlinedButton(
              onPressed: _actionLoading
                  ? null
                  : () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                              EventEditScreen(event: event),
                        ),
                      );
                      _load();
                    },
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF333333),
                side: const BorderSide(color: Color(0xFFE8E8E8)),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: const Text('Редактировать'),
            ),
          ),
          const SizedBox(width: 8),
          // Опубликовать
          Expanded(
            child: ElevatedButton(
              onPressed: _actionLoading ? null : _handlePublish,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2E7D32),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(vertical: 12),
                elevation: 0,
              ),
              child: const Text('Опубликовать'),
            ),
          ),
        ],
      );
    }

    if (event.isActive) {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: _actionLoading ? null : _handleComplete,
          icon: _actionLoading
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2),
                )
              : const Text('🏁', style: TextStyle(fontSize: 16)),
          label: Text(
            _actionLoading ? 'Завершаем...' : 'Завершить и начислить часы',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: kPrimary,
            foregroundColor: Colors.white,
            disabledBackgroundColor: Colors.grey.shade300,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8)),
            padding: const EdgeInsets.symmetric(vertical: 14),
            elevation: 0,
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildDescriptionCard(Event event) {
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Описание',
                  style: TextStyle(
                      fontSize: 15, fontWeight: FontWeight.bold)),
              if (event.eventType != null &&
                  event.eventTypeDisplay.isNotEmpty)
                _TypeBadge(label: event.eventTypeDisplay),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            event.description.isNotEmpty
                ? event.description
                : 'Описание не указано',
            style: TextStyle(
              fontSize: 14,
              height: 1.5,
              color: event.description.isNotEmpty
                  ? const Color(0xFF333333)
                  : const Color(0xFF999999),
              fontStyle: event.description.isEmpty
                  ? FontStyle.italic
                  : FontStyle.normal,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSpeakersCard(Event event) {
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Спикеры',
              style:
                  TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          ...event.speakers.map((s) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F5),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE8E8E8)),
                    ),
                    child: const Icon(Icons.person_outline,
                        size: 18, color: Color(0xFF999999)),
                  ),
                  const SizedBox(width: 10),
                  Text(s,
                      style: const TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w500)),
                ]),
              )),
        ],
      ),
    );
  }

  Widget _buildRequirementsCard(Event event) {
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Требования',
              style:
                  TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          Row(children: [
            const Icon(Icons.group_outlined,
                size: 16, color: Color(0xFF666666)),
            const SizedBox(width: 6),
            Text(
              '${event.currentVolunteers} / ${event.maxVolunteers > 0 ? event.maxVolunteers : '∞'} участников',
              style:
                  const TextStyle(fontSize: 14, color: Color(0xFF666666)),
            ),
          ]),
          if (event.dressCode != null && event.dressCode!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Row(children: [
              const Text('👔 ', style: TextStyle(fontSize: 14)),
              Text(event.dressCode!,
                  style: const TextStyle(
                      fontSize: 14, color: Color(0xFF666666))),
            ]),
          ],
          if (event.coordinatorName != null) ...[
            const SizedBox(height: 10),
            const Divider(height: 1),
            const SizedBox(height: 10),
            const Text('Координатор',
                style: TextStyle(
                    fontSize: 13, color: Color(0xFF999999))),
            const SizedBox(height: 4),
            Text(event.coordinatorName!,
                style: const TextStyle(
                    fontSize: 14, color: Color(0xFF333333))),
          ],
          if (event.isCompleted) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5E9),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(children: [
                Text('✅ ', style: TextStyle(fontSize: 14)),
                Expanded(
                  child: Text(
                    'Мероприятие завершено. Часы начислены.',
                    style: TextStyle(
                        fontSize: 13, color: Color(0xFF2E7D32)),
                  ),
                ),
              ]),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAttendeesSection() {
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(children: [
                const Text('Участники',
                    style: TextStyle(
                        fontSize: 15, fontWeight: FontWeight.bold)),
                if (_attendees.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F5),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '${_attendees.length}',
                      style: const TextStyle(
                          fontSize: 12, color: Color(0xFF666666)),
                    ),
                  ),
                ],
              ]),
              GestureDetector(
                onTap: () {
                  setState(() => _showAttendees = !_showAttendees);
                  if (_showAttendees && _attendees.isEmpty) {
                    _loadAttendees();
                  }
                },
                child: Text(
                  _showAttendees ? 'Скрыть' : 'Показать список',
                  style: const TextStyle(
                      fontSize: 14,
                      color: kPrimary,
                      fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
          if (_showAttendees) ...[
            const SizedBox(height: 12),
            if (_attendeesLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: CircularProgressIndicator(color: kPrimary),
                ),
              )
            else if (_attendees.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Text(
                  'Никто ещё не записался',
                  style: TextStyle(color: Color(0xFF999999), fontSize: 14),
                ),
              )
            else
              ...(_attendees
                  .map((a) => _AttendeeRow(
                        attendee: a,
                        eventId: widget.eventId,
                        isCompleted: _event?.isCompleted ?? false,
                        onSaved: _loadAttendees,
                      ))
                  .toList()),
          ],
        ],
      ),
    );
  }

  Widget _buildCheckinCard(Event event) {
    final checkinTime = event.checkInTime;
    if (checkinTime != null && checkinTime.isNotEmpty) {
      // Показываем время чекина
      String displayTime = checkinTime;
      try {
        final dt = DateTime.parse(checkinTime);
        displayTime =
            '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
      } catch (_) {
        if (checkinTime.length >= 16) displayTime = checkinTime.substring(11, 16);
      }
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFFE8F5E9),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFA5D6A7)),
        ),
        child: Row(children: [
          const Icon(Icons.check_circle, color: Color(0xFF2E7D32), size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Присутствие подтверждено',
                    style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF2E7D32))),
                Text('Время отметки: $displayTime',
                    style: const TextStyle(
                        fontSize: 12, color: Color(0xFF388E3C))),
              ],
            ),
          ),
        ]),
      );
    }
    // Не отмечался ещё
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF3E0),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFFFCC80)),
      ),
      child: const Row(children: [
        Icon(Icons.schedule, color: Color(0xFFE65100), size: 22),
        SizedBox(width: 10),
        Expanded(
          child: Text(
            'Отметка о присутствии ещё не сделана.\nСканируйте QR-код на мероприятии.',
            style: TextStyle(fontSize: 13, color: Color(0xFFE65100)),
          ),
        ),
      ]),
    );
  }

  Widget _buildVolunteerButton(Event event) {
    if (event.isFull && !event.isRegistered) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFF5F5F5),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Text(
          'Все места заняты',
          textAlign: TextAlign.center,
          style: TextStyle(color: Color(0xFF999999), fontSize: 15),
        ),
      );
    }

    return SizedBox(
      width: double.infinity,
      child: event.isRegistered
          ? OutlinedButton(
              onPressed: _actionLoading ? null : _handleRegister,
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF666666),
                side: const BorderSide(color: Color(0xFFE8E8E8)),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('Отменить участие',
                  style: TextStyle(fontSize: 15)),
            )
          : ElevatedButton(
              onPressed: _actionLoading ? null : _handleRegister,
              style: ElevatedButton.styleFrom(
                backgroundColor: kPrimary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                elevation: 0,
              ),
              child: Text(
                _actionLoading ? 'Отправляем...' : 'Откликнуться',
                style: const TextStyle(
                    fontSize: 15, fontWeight: FontWeight.w600),
              ),
            ),
    );
  }

  Widget _buildQrModal() {
    var raw = _qrBase64!;
    if (raw.contains(',')) raw = raw.split(',').last;
    final bytes = base64Decode(raw);
    return GestureDetector(
      onTap: () => setState(() => _showQr = false),
      child: Container(
        color: Colors.black54,
        child: Center(
          child: GestureDetector(
            onTap: () {},
            child: Container(
              margin: const EdgeInsets.all(32),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('QR-код мероприятия',
                          style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold)),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () =>
                            setState(() => _showQr = false),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Image.memory(bytes, fit: BoxFit.contain),
                  const SizedBox(height: 12),
                  const Text(
                    'Покажи этот QR волонтёрам для отметки о прибытии',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 12, color: Color(0xFF999999)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Строка участника (HR) ─────────────────────────────────────────────────────

class _AttendeeRow extends StatefulWidget {
  final Attendee attendee;
  final int eventId;
  final bool isCompleted;
  final VoidCallback onSaved;

  const _AttendeeRow({
    required this.attendee,
    required this.eventId,
    required this.onSaved,
    this.isCompleted = false,
  });

  @override
  State<_AttendeeRow> createState() => _AttendeeRowState();
}

class _AttendeeRowState extends State<_AttendeeRow> {
  late TextEditingController _leaveCtrl;
  late TextEditingController _extraCtrl;
  late TextEditingController _noteCtrl;
  bool _saving = false;
  bool _checkinLoading = false;
  String? _msg;

  @override
  void initState() {
    super.initState();
    final a = widget.attendee;
    final leave = a.earlyLeaveTime != null && a.earlyLeaveTime!.length >= 16
        ? a.earlyLeaveTime!.substring(11, 16)
        : '';
    _leaveCtrl = TextEditingController(text: leave);
    _extraCtrl =
        TextEditingController(text: a.extraHours == 0 ? '0' : a.extraHours.toString());
    _noteCtrl = TextEditingController(text: a.hoursNote ?? '');
  }

  @override
  void dispose() {
    _leaveCtrl.dispose();
    _extraCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  Color get _statusBg {
    switch (widget.attendee.status) {
      case 'ATTENDED':
        return const Color(0xFFE8F5E9);
      case 'REGISTERED':
        return const Color(0xFFE3F2FD);
      default:
        return const Color(0xFFF5F5F5);
    }
  }

  Color get _statusFg {
    switch (widget.attendee.status) {
      case 'ATTENDED':
        return const Color(0xFF2E7D32);
      case 'REGISTERED':
        return const Color(0xFF1565C0);
      default:
        return const Color(0xFF666666);
    }
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _msg = null;
    });
    try {
      await context.read<ApiService>().updateAttendeeHours(
        widget.eventId,
        widget.attendee.userId,
        {
          'earlyLeaveTime': _leaveCtrl.text,
          'extraHours': double.tryParse(_extraCtrl.text) ?? 0,
          'hoursNote': _noteCtrl.text,
        },
      );
      setState(() => _msg = '✅ Сохранено');
      widget.onSaved();
    } catch (e) {
      setState(() =>
          _msg = '❌ ${e.toString().replaceAll('Exception: ', '')}');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _checkin() async {
    // Показываем диалог выбора времени (для опоздавших)
    final now = TimeOfDay.now();
    final picked = await showTimePicker(
      context: context,
      initialTime: now,
      helpText: 'Время прибытия участника',
      builder: (ctx, child) => MediaQuery(
        data: MediaQuery.of(ctx).copyWith(alwaysUse24HourFormat: true),
        child: child!,
      ),
    );
    if (!mounted) return;
    if (picked == null) return; // HR отменил

    setState(() {
      _checkinLoading = true;
      _msg = null;
    });
    try {
      final now2 = DateTime.now();
      final checkInDateTime = DateTime(
          now2.year, now2.month, now2.day, picked.hour, picked.minute);
      await context.read<ApiService>().checkinUser(
            widget.eventId,
            widget.attendee.userId,
            checkInTime: checkInDateTime,
          );
      setState(() => _msg =
          '✅ Чекин ${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}');
      widget.onSaved();
    } catch (e) {
      setState(() =>
          _msg = '❌ ${e.toString().replaceAll('Exception: ', '')}');
    } finally {
      if (mounted) setState(() => _checkinLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final a = widget.attendee;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF9F9F9),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE8E8E8)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Шапка участника
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFFF5F5F5),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE8E8E8)),
                ),
                child: const Icon(Icons.person_outline,
                    size: 20, color: Color(0xFF999999)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(a.name,
                        style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600)),
                    if (a.phone != null || a.uniqueId != null)
                      Text(
                        [a.phone, a.uniqueId]
                            .where((s) => s != null && s.isNotEmpty)
                            .join(' · '),
                        style: const TextStyle(
                            fontSize: 11, color: Color(0xFF999999)),
                      ),
                  ],
                ),
              ),
              // Статус
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: _statusBg,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(a.statusDisplay,
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: _statusFg)),
              ),
              const SizedBox(width: 6),
              // Кнопка чекина (только если не отмечен и мероприятие не завершено)
              if (a.checkInTime == null && !widget.isCompleted)
                TextButton(
                  onPressed: _checkinLoading ? null : _checkin,
                  style: TextButton.styleFrom(
                    foregroundColor: kPrimary,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 4),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    backgroundColor: const Color(0xFFFFF3E0),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(6),
                      side: const BorderSide(color: Color(0xFFFFCC80)),
                    ),
                  ),
                  child: Text(
                    _checkinLoading ? '...' : '+ Чекин',
                    style: const TextStyle(fontSize: 11),
                  ),
                ),
            ],
          ),

          // Строка с временем чекина (если отмечен)
          if (a.checkInTime != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5E9),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: const Color(0xFFA5D6A7)),
              ),
              child: Row(children: [
                const Icon(Icons.check_circle_outline,
                    size: 14, color: Color(0xFF2E7D32)),
                const SizedBox(width: 6),
                Builder(builder: (_) {
                  final t = a.checkInTime!;
                  final display = t.length >= 16 ? t.substring(11, 16) : t;
                  return Text(
                    'Отмечен в $display',
                    style: const TextStyle(
                        fontSize: 12, color: Color(0xFF2E7D32)),
                  );
                }),
              ]),
            ),
          ],

          const SizedBox(height: 10),

          // Поля редактирования
          Row(
            children: [
              Expanded(
                child: _Field(
                  label: 'Время ухода',
                  controller: _leaveCtrl,
                  hint: '--:--',
                  keyboardType: TextInputType.datetime,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _Field(
                  label: 'Доп. часы (−опозд.)',
                  controller: _extraCtrl,
                  hint: '0',
                  keyboardType: const TextInputType.numberWithOptions(
                      decimal: true, signed: true),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          _Field(
            label: 'Примечание',
            controller: _noteCtrl,
            hint: 'Комментарий...',
          ),

          const SizedBox(height: 8),
          if (widget.isCompleted)
            const Text('Мероприятие завершено — часы зафиксированы',
                style: TextStyle(fontSize: 12, color: Color(0xFF999999)))
          else
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (_msg != null)
                Text(_msg!,
                    style: const TextStyle(
                        fontSize: 12, color: Color(0xFF666666)))
              else
                const SizedBox.shrink(),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: kPrimary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 8),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(6)),
                  elevation: 0,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(_saving ? 'Сохраняю...' : 'Сохранить',
                    style: const TextStyle(fontSize: 13)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Утилиты ───────────────────────────────────────────────────────────────────

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE8E8E8)),
      ),
      child: child,
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  final String label;
  const _StatusBadge({required this.status, required this.label});

  Color get _bg {
    switch (status) {
      case 'DRAFT':
        return const Color(0xFFF5F5F5);
      case 'OPEN':
      case 'IN_PROGRESS':
        return const Color(0xFFE3F2FD);
      case 'COMPLETED':
        return const Color(0xFFE8F5E9);
      case 'CANCELLED':
        return const Color(0xFFFFEBEE);
      default:
        return const Color(0xFFF5F5F5);
    }
  }

  Color get _fg {
    switch (status) {
      case 'DRAFT':
        return const Color(0xFF666666);
      case 'OPEN':
      case 'IN_PROGRESS':
        return const Color(0xFF1565C0);
      case 'COMPLETED':
        return const Color(0xFF2E7D32);
      case 'CANCELLED':
        return const Color(0xFFC62828);
      default:
        return const Color(0xFF666666);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
            fontSize: 12, fontWeight: FontWeight.w600, color: _fg),
      ),
    );
  }
}

class _TypeBadge extends StatelessWidget {
  final String label;
  const _TypeBadge({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF3E0),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: Color(0xFFE65100),
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final String? hint;
  final TextInputType? keyboardType;

  const _Field({
    required this.label,
    required this.controller,
    this.hint,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                fontSize: 11, color: Color(0xFF999999))),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          style: const TextStyle(fontSize: 13),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle:
                const TextStyle(fontSize: 13, color: Color(0xFFBBBBBB)),
            contentPadding: const EdgeInsets.symmetric(
                horizontal: 10, vertical: 8),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(6),
              borderSide: const BorderSide(color: Color(0xFFE8E8E8)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(6),
              borderSide: const BorderSide(color: Color(0xFFE8E8E8)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(6),
              borderSide: const BorderSide(color: kPrimary),
            ),
            isDense: true,
          ),
        ),
      ],
    );
  }
}
