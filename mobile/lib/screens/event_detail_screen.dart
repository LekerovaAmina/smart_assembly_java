import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/event.dart';
import '../models/attendance.dart';
import '../services/api_service.dart';

class EventDetailScreen extends StatefulWidget {
  final int eventId;

  const EventDetailScreen({super.key, required this.eventId});

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  Event? _event;
  Attendance? _myAttendance;
  bool _loading = true;
  bool _actionLoading = false;
  String? _error;

  static const _primaryColor = Color(0xFF1B5E20);
  static const _accentColor = Color(0xFF4CAF50);

  @override
  void initState() {
    super.initState();
    _load();
  }

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

  Future<void> _respondToEvent() async {
    setState(() => _actionLoading = true);
    try {
      final api = context.read<ApiService>();
      final attendance = await api.respondToEvent(widget.eventId);
      setState(() {
        _myAttendance = attendance;
        _actionLoading = false;
      });
      _showSnack('Вы успешно записались на мероприятие!', success: true);
    } catch (e) {
      setState(() => _actionLoading = false);
      _showSnack(e.toString().replaceAll('Exception: ', ''), success: false);
    }
  }

  Future<void> _cancelAttendance() async {
    if (_myAttendance == null) return;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Отмена участия'),
        content: const Text('Вы уверены, что хотите отменить участие?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Нет')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Отменить', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    setState(() => _actionLoading = true);
    try {
      final api = context.read<ApiService>();
      await api.cancelAttendance(_myAttendance!.id);
      setState(() {
        _myAttendance = null;
        _actionLoading = false;
      });
      _showSnack('Участие отменено', success: true);
    } catch (e) {
      setState(() => _actionLoading = false);
      _showSnack(e.toString().replaceAll('Exception: ', ''), success: false);
    }
  }

  void _showSnack(String msg, {required bool success}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: success ? _primaryColor : Colors.red,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Мероприятие',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: _primaryColor,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: _primaryColor));
    }
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 56, color: Colors.red),
            const SizedBox(height: 12),
            Text(_error!, textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _load,
              icon: const Icon(Icons.refresh),
              label: const Text('Повторить'),
              style: ElevatedButton.styleFrom(
                  backgroundColor: _primaryColor, foregroundColor: Colors.white),
            ),
          ],
        ),
      );
    }
    return _buildContent();
  }

  Widget _buildContent() {
    final event = _event!;
    final fmt = DateFormat('d MMMM yyyy, HH:mm', 'ru');

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildHeader(event),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildInfoCard(event, fmt),
                const SizedBox(height: 16),
                _buildDescriptionCard(event),
                const SizedBox(height: 16),
                _buildVolunteersCard(event),
                const SizedBox(height: 24),
                if (_myAttendance != null) _buildMyStatusCard(),
                if (_myAttendance != null) const SizedBox(height: 12),
                _buildActionButton(event),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(Event event) {
    return Container(
      color: _primaryColor,
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StatusBadge(event.statusDisplay, event.status),
          const SizedBox(height: 12),
          Text(event.title,
              style: const TextStyle(
                  color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Row(children: [
            const Icon(Icons.location_on, color: Colors.white70, size: 16),
            const SizedBox(width: 4),
            Expanded(
              child: Text(event.location,
                  style: const TextStyle(color: Colors.white70, fontSize: 14)),
            ),
          ]),
        ],
      ),
    );
  }

  Widget _buildInfoCard(Event event, DateFormat fmt) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _DetailRow(
              icon: Icons.play_circle_outline,
              label: 'Начало',
              value: fmt.format(event.startDateTime),
            ),
            const Divider(height: 20),
            _DetailRow(
              icon: Icons.stop_circle_outlined,
              label: 'Конец',
              value: fmt.format(event.endDateTime),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDescriptionCard(Event event) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(children: [
              Icon(Icons.description_outlined, color: _primaryColor, size: 20),
              SizedBox(width: 8),
              Text('Описание',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            ]),
            const SizedBox(height: 12),
            Text(event.description,
                style: const TextStyle(fontSize: 14, height: 1.5, color: Colors.black87)),
          ],
        ),
      ),
    );
  }

  Widget _buildVolunteersCard(Event event) {
    final progress =
        event.maxVolunteers > 0 ? event.currentVolunteers / event.maxVolunteers : 0.0;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.group_outlined, color: _primaryColor, size: 20),
                const SizedBox(width: 8),
                const Text('Волонтеры',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                const Spacer(),
                Text('${event.currentVolunteers} / ${event.maxVolunteers}',
                    style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: event.isFull ? Colors.red : _primaryColor)),
              ],
            ),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: progress.clamp(0.0, 1.0),
                backgroundColor: Colors.grey.shade200,
                valueColor: AlwaysStoppedAnimation(
                    event.isFull ? Colors.red : _primaryColor),
                minHeight: 8,
              ),
            ),
            if (event.isFull) ...[
              const SizedBox(height: 8),
              const Text('Все места заняты',
                  style: TextStyle(color: Colors.red, fontSize: 12)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildMyStatusCard() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 2,
      color: Colors.green.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.check_circle, color: _primaryColor),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Ваш статус участия',
                    style: TextStyle(fontSize: 12, color: Colors.grey)),
                const SizedBox(height: 2),
                Text(_myAttendance!.statusDisplay,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, color: _primaryColor)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton(Event event) {
    if (!event.isPublished) return const SizedBox.shrink();

    if (_myAttendance != null) {
      return OutlinedButton.icon(
        onPressed: _actionLoading ? null : _cancelAttendance,
        icon: _actionLoading
            ? const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Icon(Icons.cancel_outlined),
        label: const Text('Отменить участие'),
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.red,
          side: const BorderSide(color: Colors.red),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }

    return ElevatedButton.icon(
      onPressed: (event.isFull || _actionLoading) ? null : _respondToEvent,
      icon: _actionLoading
          ? const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
            )
          : const Icon(Icons.how_to_reg),
      label: Text(event.isFull ? 'Нет свободных мест' : 'Записаться'),
      style: ElevatedButton.styleFrom(
        backgroundColor: _primaryColor,
        foregroundColor: Colors.white,
        disabledBackgroundColor: Colors.grey.shade300,
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 2,
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String label;
  final String status;
  const _StatusBadge(this.label, this.status);

  Color get _color {
    switch (status) {
      case 'published':
        return Colors.green;
      case 'completed':
        return Colors.blue;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _color.withOpacity(0.5)),
      ),
      child: Text(label,
          style: TextStyle(color: _color, fontWeight: FontWeight.bold, fontSize: 12)),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _DetailRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF1B5E20), size: 20),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: const TextStyle(fontSize: 12, color: Colors.grey)),
            const SizedBox(height: 2),
            Text(value,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
          ],
        ),
      ],
    );
  }
}
