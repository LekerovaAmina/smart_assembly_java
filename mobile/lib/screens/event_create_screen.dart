import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../main.dart' show kPrimary;
import '../services/api_service.dart';

const _eventTypes = [
  ('CONFERENCE', 'Конференция'),
  ('ROUNDTABLE', 'Круглый стол'),
  ('WORKSHOP', 'Воркшоп'),
  ('CHARITY', 'Благотворительность'),
  ('CULTURAL', 'Культурное'),
  ('EDUCATIONAL', 'Образовательное'),
  ('OTHER', 'Другое'),
];

class EventCreateScreen extends StatefulWidget {
  const EventCreateScreen({super.key});

  @override
  State<EventCreateScreen> createState() => _EventCreateScreenState();
}

class _EventCreateScreenState extends State<EventCreateScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  String? _error;

  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _dateCtrl = TextEditingController();
  final _startCtrl = TextEditingController();
  final _endCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _dressCtrl = TextEditingController();
  final _objectivesCtrl = TextEditingController();
  final _tasksCtrl = TextEditingController();
  final _speakersCtrl = TextEditingController();
  final _maxCtrl = TextEditingController(text: '10');
  String _eventType = 'EDUCATIONAL';

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

  Future<void> _submit(String status) async {
    if (_nameCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Введите название мероприятия');
      return;
    }
    if (status == 'OPEN' &&
        (_dateCtrl.text.isEmpty ||
            _startCtrl.text.isEmpty ||
            _locationCtrl.text.trim().isEmpty)) {
      setState(() => _error =
          'Для публикации заполните: Дату, Время начала и Место проведения');
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
      'status': status,
    };

    try {
      await context.read<ApiService>().createEvent(payload);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(status == 'DRAFT'
              ? 'Мероприятие сохранено в черновики'
              : 'Мероприятие опубликовано!'),
          backgroundColor: kPrimary,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
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
        title: const Text('Создание мероприятия',
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
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFEBEE),
                      borderRadius: BorderRadius.circular(8),
                      border:
                          Border.all(color: const Color(0xFFEF9A9A)),
                    ),
                    child: Text(_error!,
                        style: const TextStyle(
                            color: Color(0xFFC62828), fontSize: 13)),
                  ),
                  const SizedBox(height: 12),
                ],

                // Название
                _Label(text: 'Название', required: true),
                _Input(controller: _nameCtrl, hint: 'например, Субботник в парке'),
                const SizedBox(height: 12),

                // Тип мероприятия
                _Label(text: 'Тип мероприятия'),
                _DropdownField(
                  value: _eventType,
                  items: _eventTypes.map((t) => (t.$1, t.$2)).toList(),
                  onChanged: (v) => setState(() => _eventType = v!),
                ),
                const SizedBox(height: 12),

                // Описание
                _Label(text: 'Описание'),
                _Input(
                    controller: _descCtrl, maxLines: 4),
                const SizedBox(height: 12),

                // Дата + Время
                Row(children: [
                  Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _Label(text: 'Дата', required: true),
                          _DateTimeInput(
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
                          _Label(text: 'Начало', required: true),
                          _DateTimeInput(
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
                          _Label(text: 'Окончание'),
                          _DateTimeInput(
                            controller: _endCtrl,
                            hint: '--:--',
                            icon: Icons.access_time_outlined,
                            onTap: () => _pickTime(_endCtrl),
                          ),
                        ]),
                  ),
                ]),
                const SizedBox(height: 12),

                // Место + Дресс-код
                Row(children: [
                  Expanded(
                    flex: 3,
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _Label(text: 'Место проведения', required: true),
                          _Input(
                              controller: _locationCtrl,
                              hint: 'Дом Дружбы, Астана'),
                        ]),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 2,
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _Label(text: 'Дресс-код'),
                          _Input(
                              controller: _dressCtrl,
                              hint: 'Деловой стиль'),
                        ]),
                  ),
                ]),
                const SizedBox(height: 12),

                // Цели + Задачи
                Row(children: [
                  Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _Label(text: 'Цели'),
                          _Input(controller: _objectivesCtrl),
                        ]),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _Label(text: 'Задачи'),
                          _Input(controller: _tasksCtrl),
                        ]),
                  ),
                ]),
                const SizedBox(height: 12),

                // Спикеры + Макс. участников
                Row(children: [
                  Expanded(
                    flex: 3,
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _Label(text: 'Спикеры (через запятую)'),
                          _Input(
                              controller: _speakersCtrl,
                              hint: 'Айгерим, Данияр'),
                        ]),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 2,
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _Label(text: 'Макс. участников', required: true),
                          _Input(
                            controller: _maxCtrl,
                            keyboardType: TextInputType.number,
                          ),
                        ]),
                  ),
                ]),
                const SizedBox(height: 24),

                // Кнопки
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Отмена',
                          style: TextStyle(color: Color(0xFF999999))),
                    ),
                    Row(children: [
                      OutlinedButton(
                        onPressed:
                            _loading ? null : () => _submit('DRAFT'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: kPrimary,
                          side: const BorderSide(color: kPrimary),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                        ),
                        child: const Text('В черновики'),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton(
                        onPressed:
                            _loading ? null : () => _submit('OPEN'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: kPrimary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                          elevation: 0,
                        ),
                        child: Text(
                            _loading ? 'Публикация...' : 'Опубликовать'),
                      ),
                    ]),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
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
      final s =
          '${picked.day.toString().padLeft(2, '0')}.${picked.month.toString().padLeft(2, '0')}.${picked.year}';
      setState(() => _dateCtrl.text = s);
    }
  }

  Future<void> _pickTime(TextEditingController ctrl) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
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

class _Label extends StatelessWidget {
  final String text;
  final bool required;
  const _Label({required this.text, this.required = false});

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
              ? const [
                  TextSpan(
                      text: ' *',
                      style: TextStyle(color: Colors.red))
                ]
              : [],
        ),
      ),
    );
  }
}

class _Input extends StatelessWidget {
  final TextEditingController controller;
  final String? hint;
  final int maxLines;
  final TextInputType? keyboardType;

  const _Input({
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
        hintStyle:
            const TextStyle(fontSize: 14, color: Color(0xFFBBBBBB)),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
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

class _DateTimeInput extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final VoidCallback onTap;

  const _DateTimeInput({
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
        hintStyle:
            const TextStyle(fontSize: 14, color: Color(0xFFBBBBBB)),
        suffixIcon: Icon(icon, size: 18, color: const Color(0xFF999999)),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
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

class _DropdownField extends StatelessWidget {
  final String value;
  final List<(String, String)> items;
  final ValueChanged<String?> onChanged;

  const _DropdownField({
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
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
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
