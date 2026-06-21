import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../main.dart' show kPrimary;
import '../models/event.dart';
import '../services/api_service.dart';

const _editEventTypes = [
  ('CONFERENCE', 'Конференция'),
  ('ROUNDTABLE', 'Круглый стол'),
  ('WORKSHOP', 'Воркшоп'),
  ('CHARITY', 'Благотворительность'),
  ('CULTURAL', 'Культурное'),
  ('EDUCATIONAL', 'Образовательное'),
  ('OTHER', 'Другое'),
];

class EventEditScreen extends StatefulWidget {
  final Event event;
  const EventEditScreen({super.key, required this.event});

  @override
  State<EventEditScreen> createState() => _EventEditScreenState();
}

class _EventEditScreenState extends State<EventEditScreen> {
  bool _loading = false;
  String? _error;

  late final TextEditingController _nameCtrl;
  late final TextEditingController _descCtrl;
  late final TextEditingController _dateCtrl;
  late final TextEditingController _startCtrl;
  late final TextEditingController _endCtrl;
  late final TextEditingController _locationCtrl;
  late final TextEditingController _dressCtrl;
  late final TextEditingController _objectivesCtrl;
  late final TextEditingController _tasksCtrl;
  late final TextEditingController _speakersCtrl;
  late final TextEditingController _maxCtrl;
  late String _eventType;

  @override
  void initState() {
    super.initState();
    final e = widget.event;
    _nameCtrl = TextEditingController(text: e.eventName);
    _descCtrl = TextEditingController(text: e.description ?? '');
    _dateCtrl = TextEditingController(text: _formatDate(e.startDateTime));
    _startCtrl = TextEditingController(text: _formatTime(e.startDateTime));
    _endCtrl = TextEditingController(text: _formatTime(e.endDateTime));
    _locationCtrl = TextEditingController(text: e.location);
    _dressCtrl = TextEditingController(text: e.dressCode ?? '');
    _objectivesCtrl = TextEditingController(text: e.objectives ?? '');
    _tasksCtrl = TextEditingController(text: e.tasks ?? '');
    _speakersCtrl = TextEditingController(text: e.speakers.join(', '));
    _maxCtrl = TextEditingController(text: '${e.maxVolunteers}');
    _eventType = e.eventType ?? 'EDUCATIONAL';
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    _dateCtrl.dispose();
    _startCtrl.dispose();
    _endCtrl.dispose();
    _locationCtrl.dispose();
    _dressCtrl.dispose();
    _objectivesCtrl.dispose();
    _tasksCtrl.dispose();
    _speakersCtrl.dispose();
    _maxCtrl.dispose();
    super.dispose();
  }

  String _formatDate(DateTime dt) {
    return '${dt.day.toString().padLeft(2, '0')}.${dt.month.toString().padLeft(2, '0')}.${dt.year}';
  }

  String _formatTime(DateTime dt) {
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  String? _parseDate(String display) {
    final parts = display.split('.');
    if (parts.length != 3) return null;
    return '${parts[2]}-${parts[1].padLeft(2, '0')}-${parts[0].padLeft(2, '0')}';
  }

  String? _cleanTime(String t) {
    final s = t.trim();
    if (s.isEmpty) return null;
    final parts = s.split(':');
    final h = (parts.isNotEmpty ? parts[0] : '00').padLeft(2, '0');
    final m = (parts.length > 1 ? parts[1] : '00').padLeft(2, '0');
    return '$h:$m:00';
  }

  Future<void> _submit() async {
    if (_nameCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Введите название мероприятия');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    final speakers = _speakersCtrl.text
        .split(',')
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();

    final payload = {
      'eventName': _nameCtrl.text.trim(),
      'eventType': _eventType,
      'description': _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
      'eventDate': _dateCtrl.text.isEmpty ? null : _parseDate(_dateCtrl.text),
      'startTime': _cleanTime(_startCtrl.text),
      'endTime': _cleanTime(_endCtrl.text),
      'location': _locationCtrl.text.trim().isEmpty ? null : _locationCtrl.text.trim(),
      'dressCode': _dressCtrl.text.trim().isEmpty ? null : _dressCtrl.text.trim(),
      'objectives': _objectivesCtrl.text.trim().isEmpty ? null : _objectivesCtrl.text.trim(),
      'tasks': _tasksCtrl.text.trim().isEmpty ? null : _tasksCtrl.text.trim(),
      'speakers': speakers,
      'maxParticipants': int.tryParse(_maxCtrl.text) ?? 10,
    };

    try {
      await context.read<ApiService>().updateEvent(widget.event.id, payload);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: const Text('Изменения сохранены'),
          backgroundColor: kPrimary,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ));
        Navigator.pop(context);
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: const Text('Редактирование',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: kPrimary,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE8E8E8)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_error != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFEBEE),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFEF9A9A)),
                  ),
                  child: Text(_error!,
                      style: const TextStyle(
                          color: Color(0xFFC62828), fontSize: 13)),
                ),
                const SizedBox(height: 12),
              ],

              _ELabel(text: 'Название', required: true),
              _EInput(controller: _nameCtrl, hint: 'например, Субботник в парке'),
              const SizedBox(height: 12),

              _ELabel(text: 'Тип мероприятия'),
              _EDropdown(
                value: _eventType,
                items: _editEventTypes.map((t) => (t.$1, t.$2)).toList(),
                onChanged: (v) => setState(() => _eventType = v!),
              ),
              const SizedBox(height: 12),

              _ELabel(text: 'Описание'),
              _EInput(controller: _descCtrl, maxLines: 4),
              const SizedBox(height: 12),

              Row(children: [
                Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _ELabel(text: 'Дата', required: true),
                        _EDateTimeInput(
                          controller: _dateCtrl,
                          hint: 'дд.мм.гггг',
                          icon: Icons.calendar_today_outlined,
                          onTap: () => _pickDate(),
                        ),
                      ]),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _ELabel(text: 'Начало', required: true),
                        _EDateTimeInput(
                          controller: _startCtrl,
                          hint: '--:--',
                          icon: Icons.access_time_outlined,
                          onTap: () => _pickTime(_startCtrl),
                        ),
                      ]),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _ELabel(text: 'Окончание'),
                        _EDateTimeInput(
                          controller: _endCtrl,
                          hint: '--:--',
                          icon: Icons.access_time_outlined,
                          onTap: () => _pickTime(_endCtrl),
                        ),
                      ]),
                ),
              ]),
              const SizedBox(height: 12),

              Row(children: [
                Expanded(
                  flex: 3,
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _ELabel(text: 'Место проведения', required: true),
                        _EInput(controller: _locationCtrl, hint: 'Дом Дружбы, Астана'),
                      ]),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _ELabel(text: 'Дресс-код'),
                        _EInput(controller: _dressCtrl, hint: 'Деловой стиль'),
                      ]),
                ),
              ]),
              const SizedBox(height: 12),

              Row(children: [
                Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _ELabel(text: 'Цели'),
                        _EInput(controller: _objectivesCtrl),
                      ]),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _ELabel(text: 'Задачи'),
                        _EInput(controller: _tasksCtrl),
                      ]),
                ),
              ]),
              const SizedBox(height: 12),

              Row(children: [
                Expanded(
                  flex: 3,
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _ELabel(text: 'Спикеры (через запятую)'),
                        _EInput(controller: _speakersCtrl, hint: 'Айгерим, Данияр'),
                      ]),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _ELabel(text: 'Макс. участников', required: true),
                        _EInput(
                          controller: _maxCtrl,
                          keyboardType: TextInputType.number,
                        ),
                      ]),
                ),
              ]),
              const SizedBox(height: 24),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Отмена',
                        style: TextStyle(color: Color(0xFF999999))),
                  ),
                  ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kPrimary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 24, vertical: 12),
                    ),
                    child: Text(_loading ? 'Сохранение...' : 'Сохранить изменения'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickDate() async {
    DateTime initial;
    try {
      final parts = _dateCtrl.text.split('.');
      initial = parts.length == 3
          ? DateTime(int.parse(parts[2]), int.parse(parts[1]), int.parse(parts[0]))
          : DateTime.now();
    } catch (_) {
      initial = DateTime.now();
    }

    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2024),
      lastDate: DateTime(2030),
      builder: (ctx, child) => Theme(
        data: ThemeData.light().copyWith(
          colorScheme: const ColorScheme.light(primary: kPrimary),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() => _dateCtrl.text = _formatDate(picked));
    }
  }

  Future<void> _pickTime(TextEditingController ctrl) async {
    TimeOfDay initial = TimeOfDay.now();
    if (ctrl.text.isNotEmpty) {
      final parts = ctrl.text.split(':');
      if (parts.length >= 2) {
        initial = TimeOfDay(
          hour: int.tryParse(parts[0]) ?? 0,
          minute: int.tryParse(parts[1]) ?? 0,
        );
      }
    }

    final picked = await showTimePicker(
      context: context,
      initialTime: initial,
      builder: (ctx, child) => Theme(
        data: ThemeData.light().copyWith(
          colorScheme: const ColorScheme.light(primary: kPrimary),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      final h = picked.hour.toString().padLeft(2, '0');
      final m = picked.minute.toString().padLeft(2, '0');
      setState(() => ctrl.text = '$h:$m');
    }
  }
}

// ── Утилиты ───────────────────────────────────────────────────────────────────

class _ELabel extends StatelessWidget {
  final String text;
  final bool required;
  const _ELabel({required this.text, this.required = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: RichText(
        text: TextSpan(
          text: text,
          style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: Color(0xFF333333)),
          children: required
              ? const [TextSpan(text: ' *', style: TextStyle(color: Colors.red))]
              : [],
        ),
      ),
    );
  }
}

class _EInput extends StatelessWidget {
  final TextEditingController controller;
  final String? hint;
  final int maxLines;
  final TextInputType? keyboardType;

  const _EInput({
    required this.controller,
    this.hint,
    this.maxLines = 1,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      style: const TextStyle(fontSize: 14),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(fontSize: 14, color: Color(0xFFBBBBBB)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFFE8E8E8)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFFE8E8E8)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: kPrimary),
        ),
        isDense: true,
      ),
    );
  }
}

class _EDateTimeInput extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final VoidCallback onTap;

  const _EDateTimeInput({
    required this.controller,
    required this.hint,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      readOnly: true,
      onTap: onTap,
      style: const TextStyle(fontSize: 14),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(fontSize: 14, color: Color(0xFFBBBBBB)),
        suffixIcon: Icon(icon, size: 18, color: const Color(0xFF999999)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFFE8E8E8)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFFE8E8E8)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: kPrimary),
        ),
        isDense: true,
      ),
    );
  }
}

class _EDropdown extends StatelessWidget {
  final String value;
  final List<(String, String)> items;
  final ValueChanged<String?> onChanged;

  const _EDropdown({
    required this.value,
    required this.items,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      value: value,
      onChanged: onChanged,
      style: const TextStyle(fontSize: 14, color: Color(0xFF1A1A1A)),
      decoration: InputDecoration(
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFFE8E8E8)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFFE8E8E8)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: kPrimary),
        ),
        isDense: true,
      ),
      items: items
          .map((t) => DropdownMenuItem(value: t.$1, child: Text(t.$2)))
          .toList(),
    );
  }
}
