import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../screens/appeals_screen.dart';
import '../screens/registration_screen.dart';
import '../screens/settings_screen.dart';
import '../screens/statistics_screen.dart';
import '../screens/strikes_screen.dart';
import '../screens/top_volunteers_screen.dart';
import '../screens/volunteers_screen.dart';
import 'package:provider/provider.dart';

class AppDrawer extends StatefulWidget {
  final VoidCallback onLogout;
  final int currentIndex;
  final ValueChanged<int> onNavTap;

  const AppDrawer({
    super.key,
    required this.onLogout,
    required this.currentIndex,
    required this.onNavTap,
  });

  @override
  State<AppDrawer> createState() => _AppDrawerState();
}

class _AppDrawerState extends State<AppDrawer> {
  User? _user;

  static const _primaryColor = Color(0xFF1B5E20);

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    try {
      final api = context.read<ApiService>();
      final user = await api.getMe();
      if (mounted) setState(() => _user = user);
    } catch (_) {}
  }

  bool get _isHr {
    final role = _user?.role ?? '';
    return role == 'HR' || role == 'ADMIN' || role == 'SUPER_ADMIN';
  }

  void _openScreen(BuildContext context, Widget screen) {
    Navigator.pop(context);
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: Column(
        children: [
          _buildHeader(),
          Expanded(child: _buildMenu(context)),
          _buildFooter(context),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return DrawerHeader(
      decoration: const BoxDecoration(color: _primaryColor),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: Colors.white,
            child: Text(
              _user?.firstName.isNotEmpty == true
                  ? _user!.firstName[0].toUpperCase()
                  : '?',
              style: const TextStyle(
                  fontSize: 24, fontWeight: FontWeight.bold, color: _primaryColor),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            _user?.fullName ?? 'Загрузка...',
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 2),
          Text(
            _user?.roleDisplay ?? '',
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildMenu(BuildContext context) {
    final items = [
      _MenuItem(icon: Icons.event, label: 'Мероприятия', index: 0),
      _MenuItem(icon: Icons.person, label: 'Профиль', index: 1),
    ];

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Text('НАВИГАЦИЯ',
              style: TextStyle(fontSize: 11, color: Colors.grey, letterSpacing: 1)),
        ),
        ...items.map((item) => ListTile(
              leading: Icon(item.icon,
                  color: widget.currentIndex == item.index
                      ? _primaryColor
                      : Colors.grey),
              title: Text(item.label,
                  style: TextStyle(
                      fontWeight: widget.currentIndex == item.index
                          ? FontWeight.bold
                          : FontWeight.normal,
                      color: widget.currentIndex == item.index
                          ? _primaryColor
                          : Colors.black87)),
              selected: widget.currentIndex == item.index,
              selectedTileColor: _primaryColor.withAlpha(20),
              onTap: () {
                Navigator.pop(context);
                widget.onNavTap(item.index);
              },
            )),
        const Divider(height: 24),
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 4, 16, 4),
          child: Text('СООБЩЕСТВО',
              style: TextStyle(fontSize: 11, color: Colors.grey, letterSpacing: 1)),
        ),
        ListTile(
          leading: const Icon(Icons.emoji_events_outlined, color: Colors.grey),
          title: const Text('Топ волонтёров'),
          onTap: () => _openScreen(context, const TopVolunteersScreen()),
        ),
        if (_isHr)
          ListTile(
            leading: const Icon(Icons.groups_outlined, color: Colors.grey),
            title: const Text('Волонтёры'),
            onTap: () => _openScreen(context, const VolunteersScreen()),
          ),
        if (_isHr)
          ListTile(
            leading: const Icon(Icons.how_to_reg_outlined, color: Colors.grey),
            title: const Text('Заявки на вступление'),
            onTap: () => _openScreen(context, const RegistrationScreen()),
          ),
        if (_isHr)
          ListTile(
            leading: const Icon(Icons.gavel_outlined, color: Colors.grey),
            title: const Text('Апелляции'),
            onTap: () => _openScreen(context, const AppealsScreen()),
          ),
        if (_user != null && !_isHr)
          ListTile(
            leading: const Icon(Icons.warning_amber_outlined, color: Colors.grey),
            title: const Text('Мои страйки'),
            onTap: () => _openScreen(context, const StrikesScreen()),
          ),
        if (_user != null && !_isHr)
          ListTile(
            leading: const Icon(Icons.bar_chart_outlined, color: Colors.grey),
            title: const Text('Статистика часов'),
            onTap: () => _openScreen(context, const StatisticsScreen()),
          ),
        const Divider(height: 24),
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 4, 16, 4),
          child: Text('АККАУНТ',
              style: TextStyle(fontSize: 11, color: Colors.grey, letterSpacing: 1)),
        ),
        ListTile(
          leading: const Icon(Icons.settings_outlined, color: Colors.grey),
          title: const Text('Настройки'),
          onTap: () => _openScreen(context, SettingsScreen(onLogout: widget.onLogout)),
        ),
      ],
    );
  }

  Widget _buildFooter(BuildContext context) {
    return Column(
      children: [
        const Divider(height: 1),
        ListTile(
          leading: const Icon(Icons.logout, color: Colors.red),
          title: const Text('Выйти', style: TextStyle(color: Colors.red)),
          onTap: () async {
            Navigator.pop(context);
            final api = context.read<ApiService>();
            await api.logout();
            widget.onLogout();
          },
        ),
        const SizedBox(height: 8),
        const Text('Ассамблея Жастары v1.0',
            style: TextStyle(fontSize: 11, color: Colors.grey)),
        const SizedBox(height: 12),
      ],
    );
  }
}

class _MenuItem {
  final IconData icon;
  final String label;
  final int index;
  _MenuItem({required this.icon, required this.label, required this.index});
}
