import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../main.dart' show homeScaffoldKey;
import '../models/user.dart';
import '../services/api_service.dart';

class ProfileScreen extends StatefulWidget {
  final VoidCallback onLogout;

  const ProfileScreen({super.key, required this.onLogout});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  User? _user;
  bool _loading = true;
  String? _error;

  static const _primaryColor = Color(0xFFE55F00);

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = context.read<ApiService>();
      final user = await api.getMe();
      setState(() {
        _user = user;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<void> _confirmLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Выход'),
        content: const Text('Вы уверены, что хотите выйти из аккаунта?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Отмена')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Выйти', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    final api = context.read<ApiService>();
    await api.logout();
    widget.onLogout();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.menu, color: Colors.white),
          onPressed: () => homeScaffoldKey.currentState?.openDrawer(),
        ),
        title: const Text('Профиль',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: _primaryColor,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadProfile,
            tooltip: 'Обновить',
          ),
        ],
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
              onPressed: _loadProfile,
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
    final user = _user!;
    return SingleChildScrollView(
      child: Column(
        children: [
          _buildAvatar(user),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildStatsRow(user),
                const SizedBox(height: 16),
                _buildInfoCard(user),
                const SizedBox(height: 16),
                _buildLogoutButton(),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatar(User user) {
    return Container(
      width: double.infinity,
      color: _primaryColor,
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 36),
      child: Column(
        children: [
          CircleAvatar(
            radius: 48,
            backgroundColor: Colors.white,
            child: Text(
              user.firstName.isNotEmpty ? user.firstName[0].toUpperCase() : '?',
              style: const TextStyle(
                  fontSize: 36, fontWeight: FontWeight.bold, color: _primaryColor),
            ),
          ),
          const SizedBox(height: 14),
          Text(user.fullName,
              style: const TextStyle(
                  color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(user.roleDisplay,
              style: const TextStyle(color: Colors.white70, fontSize: 14)),
          const SizedBox(height: 4),
          Text(user.phone,
              style: const TextStyle(color: Colors.white60, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildStatsRow(User user) {
    return Row(
      children: [
        Expanded(child: _StatCard(
          icon: Icons.schedule,
          value: '${user.totalHours}',
          label: 'Часов',
          color: _primaryColor,
        )),
        const SizedBox(width: 12),
        Expanded(child: _StatCard(
          icon: Icons.warning_amber_outlined,
          value: '${user.strikeCount}',
          label: 'Предупреждений',
          color: user.strikeCount > 0 ? Colors.orange : Colors.grey,
        )),
        const SizedBox(width: 12),
        Expanded(child: _StatCard(
          icon: Icons.badge_outlined,
          value: user.uniqueId,
          label: 'ID',
          color: Colors.blue,
        )),
      ],
    );
  }

  Widget _buildInfoCard(User user) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Информация об аккаунте',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const Divider(height: 20),
            _ProfileRow(icon: Icons.person_outline, label: 'Имя', value: user.firstName),
            const Divider(height: 16),
            _ProfileRow(icon: Icons.person_outline, label: 'Фамилия', value: user.lastName),
            const Divider(height: 16),
            _ProfileRow(icon: Icons.phone_outlined, label: 'Телефон', value: user.phone),
            const Divider(height: 16),
            _ProfileRow(
                icon: Icons.circle,
                label: 'Статус',
                value: user.status,
                valueColor: user.status == 'ACTIVE' ? Colors.green : Colors.orange),
            if (user.departmentId != null) ...[
              const Divider(height: 16),
              _ProfileRow(
                  icon: Icons.business_outlined,
                  label: 'Отдел',
                  value: '${user.departmentId}'),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildLogoutButton() {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: _confirmLogout,
        icon: const Icon(Icons.logout, color: Colors.red),
        label: const Text('Выйти из аккаунта',
            style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: Colors.red),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 6),
            Text(value,
                style: TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold, color: color),
                maxLines: 1,
                overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Text(label,
                style: const TextStyle(fontSize: 11, color: Colors.grey),
                textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _ProfileRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  const _ProfileRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: Colors.grey),
        const SizedBox(width: 12),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
        const Spacer(),
        Text(value,
            style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
                color: valueColor ?? Colors.black87)),
      ],
    );
  }
}
