import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../models/user.dart';
import '../models/strike.dart';
import '../main.dart';

class VolunteerDetailScreen extends StatefulWidget {
  final int userId;
  const VolunteerDetailScreen({super.key, required this.userId});

  @override
  State<VolunteerDetailScreen> createState() => _VolunteerDetailScreenState();
}

class _VolunteerDetailScreenState extends State<VolunteerDetailScreen> {
  User? _user;
  List<Strike> _strikes = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = context.read<ApiService>();
      final user = await api.getUserById(widget.userId);
      List<Strike> strikes = [];
      try { strikes = await api.getVolunteerStrikes(widget.userId); } catch (_) {}
      setState(() { _user = user; _strikes = strikes; _loading = false; });
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
        title: Text(_user?.fullName ?? 'Волонтёр',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: kPrimary,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: kPrimary))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : _buildContent(),
      floatingActionButton: _user != null
          ? FloatingActionButton.extended(
              onPressed: _showStrikeDialog,
              backgroundColor: Colors.red,
              icon: const Icon(Icons.warning_amber_rounded, color: Colors.white),
              label: const Text('Выдать страйк', style: TextStyle(color: Colors.white)),
            )
          : null,
    );
  }

  Widget _buildContent() {
    final user = _user!;
    return SingleChildScrollView(
      child: Column(
        children: [
          Container(
            width: double.infinity,
            color: kPrimary,
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: Colors.white,
                  child: Text(
                    user.firstName.isNotEmpty ? user.firstName[0].toUpperCase() : '?',
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: kPrimary),
                  ),
                ),
                const SizedBox(height: 12),
                Text(user.fullName,
                    style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(user.roleDisplay,
                    style: const TextStyle(color: Colors.white70, fontSize: 14)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(child: _statCard('Часы', '${user.totalHours}', Icons.schedule, kPrimary)),
                    const SizedBox(width: 12),
                    Expanded(child: _statCard('Страйки', '${user.strikeCount}', Icons.warning_amber,
                        user.strikeCount > 0 ? Colors.red : Colors.grey)),
                    const SizedBox(width: 12),
                    Expanded(child: _statCard('ID', user.uniqueId, Icons.badge, Colors.blue)),
                  ],
                ),
                const SizedBox(height: 16),
                _infoCard(user),
                if (_strikes.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  const Text('Страйки', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ..._strikes.map(_buildStrikeItem),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 4),
            Text(value,
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color),
                maxLines: 1, overflow: TextOverflow.ellipsis),
            Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Widget _infoCard(User user) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Информация', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const Divider(height: 20),
            _row('Телефон', user.phone),
            const Divider(height: 16),
            _row('Статус', user.status),
            const Divider(height: 16),
            _row('Роль', user.roleDisplay),
          ],
        ),
      ),
    );
  }

  Widget _row(String label, String value) {
    return Row(
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
        const Spacer(),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
      ],
    );
  }

  Widget _buildStrikeItem(Strike strike) {
    final dateStr = DateFormat('dd.MM.yyyy', 'ru').format(strike.issuedAt);
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: strike.isActive ? Colors.red.shade100 : Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.warning_amber, size: 20,
              color: strike.isActive ? Colors.red : Colors.grey),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(strike.reason, style: const TextStyle(fontSize: 13)),
                Text(dateStr, style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
              ],
            ),
          ),
          if (!strike.isActive)
            const Text('Снят', style: TextStyle(fontSize: 11, color: Colors.green, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  void _showStrikeDialog() {
    final reasonController = TextEditingController();
    String severity = 'LOW';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Выдать страйк'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Волонтёр: ${_user?.fullName}',
                  style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: severity,
                decoration: InputDecoration(
                  labelText: 'Тяжесть',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                items: const [
                  DropdownMenuItem(value: 'LOW', child: Text('Лёгкий')),
                  DropdownMenuItem(value: 'MEDIUM', child: Text('Средний')),
                  DropdownMenuItem(value: 'HIGH', child: Text('Серьёзный')),
                  DropdownMenuItem(value: 'CRITICAL', child: Text('Критический')),
                ],
                onChanged: (v) => setDialogState(() => severity = v!),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: reasonController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'Причина страйка...',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: kPrimary),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Отмена'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (reasonController.text.trim().isEmpty) return;
                Navigator.pop(ctx);
                try {
                  final api = context.read<ApiService>();
                  await api.createStrike(widget.userId, {
                    'reason': reasonController.text.trim(),
                    'severity': severity,
                  });
                  _load();
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Страйк выдан'), backgroundColor: Colors.green),
                    );
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Ошибка: $e'), backgroundColor: Colors.red),
                    );
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Выдать', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
}
