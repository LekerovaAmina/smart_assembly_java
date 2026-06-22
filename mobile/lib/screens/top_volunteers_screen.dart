import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../models/strike.dart';
import '../main.dart';

class TopVolunteersScreen extends StatefulWidget {
  const TopVolunteersScreen({super.key});

  @override
  State<TopVolunteersScreen> createState() => _TopVolunteersScreenState();
}

class _TopVolunteersScreenState extends State<TopVolunteersScreen> {
  List<RatingEntry> _entries = [];
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
      final data = await api.getRating();
      setState(() {
        _entries = data.length > 10 ? data.sublist(0, 10) : data;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final userState = context.watch<UserState>();
    final myId = userState.user?.id;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: const Text('Топ волонтёров',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: kPrimary,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: kPrimary))
          : _error != null
              ? _buildError()
              : RefreshIndicator(
                  color: kPrimary,
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _entries.length + 1,
                    itemBuilder: (ctx, i) {
                      if (i == 0) return _buildHeader();
                      return _buildEntry(i, _entries[i - 1], myId);
                    },
                  ),
                ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Colors.red),
          const SizedBox(height: 12),
          Text(_error!, style: const TextStyle(color: Colors.red)),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _load,
            style: ElevatedButton.styleFrom(backgroundColor: kPrimary),
            child: const Text('Повторить', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    if (_entries.length < 3) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          _buildPodium(_entries[1], 2, 80, Colors.grey.shade400),
          const SizedBox(width: 8),
          _buildPodium(_entries[0], 1, 100, const Color(0xFFFFD700)),
          const SizedBox(width: 8),
          _buildPodium(_entries[2], 3, 64, const Color(0xFFCD7F32)),
        ],
      ),
    );
  }

  Widget _buildPodium(RatingEntry entry, int place, double height, Color color) {
    final medals = ['🥇', '🥈', '🥉'];
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(medals[place - 1], style: const TextStyle(fontSize: 28)),
        const SizedBox(height: 4),
        Text(
          entry.firstName,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          overflow: TextOverflow.ellipsis,
        ),
        Text(
          '${entry.totalHours.toStringAsFixed(1)}ч',
          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
        ),
        const SizedBox(height: 6),
        Container(
          width: 80,
          height: height,
          decoration: BoxDecoration(
            color: color.withAlpha(50),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            border: Border.all(color: color, width: 2),
          ),
          alignment: Alignment.center,
          child: Text(
            '$place',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color),
          ),
        ),
      ],
    );
  }

  Widget _buildEntry(int index, RatingEntry entry, int? myId) {
    final place = index;
    final isMe = entry.id == myId;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isMe ? const Color(0xFFFFF3E0) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: isMe
            ? Border.all(color: kPrimary, width: 1.5)
            : Border.all(color: Colors.grey.shade200),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: _buildPlaceBadge(place),
        title: Text(
          isMe ? 'Вы' : entry.fullName,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: isMe ? kPrimary : Colors.black87,
          ),
        ),
        subtitle: Text(
          _roleDisplay(entry.role),
          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
        ),
        trailing: Text(
          '${entry.totalHours.toStringAsFixed(1)}ч',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
            color: isMe ? kPrimary : Colors.black87,
          ),
        ),
      ),
    );
  }

  Widget _buildPlaceBadge(int place) {
    Color bg;
    Color fg;
    if (place == 1) {
      bg = const Color(0xFFFFF9C4); fg = const Color(0xFFF9A825);
    } else if (place == 2) {
      bg = Colors.grey.shade100; fg = Colors.grey.shade600;
    } else if (place == 3) {
      bg = const Color(0xFFFFE0B2); fg = const Color(0xFFE65100);
    } else {
      bg = Colors.grey.shade50; fg = Colors.grey.shade500;
    }

    return CircleAvatar(
      radius: 18,
      backgroundColor: bg,
      child: Text('$place', style: TextStyle(fontWeight: FontWeight.bold, color: fg, fontSize: 14)),
    );
  }

  String _roleDisplay(String role) {
    switch (role) {
      case 'VOLUNTEER': return 'Волонтёр';
      case 'HR': return 'HR';
      case 'COORDINATOR': return 'Координатор';
      case 'SUPER_ADMIN': return 'Администратор';
      default: return role;
    }
  }
}
