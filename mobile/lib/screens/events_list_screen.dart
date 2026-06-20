import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/event.dart';
import '../services/api_service.dart';
import 'event_detail_screen.dart';

class EventsListScreen extends StatefulWidget {
  const EventsListScreen({super.key});

  @override
  State<EventsListScreen> createState() => _EventsListScreenState();
}

class _EventsListScreenState extends State<EventsListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final List<String?> _filters = [null, 'published', 'completed'];
  final List<String> _filterLabels = ['Все', 'Активные', 'Завершённые'];

  List<Event> _events = [];
  bool _loading = false;
  String? _error;

  static const _primaryColor = Color(0xFF1B5E20);

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) _loadEvents();
    });
    _loadEvents();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadEvents() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = context.read<ApiService>();
      final status = _filters[_tabController.index];
      final events = await api.getEvents(status: status);
      setState(() {
        _events = events;
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
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: const Text('Мероприятия',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: _primaryColor,
        iconTheme: const IconThemeData(color: Colors.white),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          tabs: _filterLabels.map((l) => Tab(text: l)).toList(),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: List.generate(3, (_) => _buildBody()),
      ),
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
              onPressed: _loadEvents,
              icon: const Icon(Icons.refresh),
              label: const Text('Повторить'),
              style: ElevatedButton.styleFrom(backgroundColor: _primaryColor,
                  foregroundColor: Colors.white),
            ),
          ],
        ),
      );
    }
    if (_events.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.event_busy, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            const Text('Мероприятий нет',
                style: TextStyle(fontSize: 18, color: Colors.grey)),
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: _loadEvents,
              icon: const Icon(Icons.refresh),
              label: const Text('Обновить'),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      color: _primaryColor,
      onRefresh: _loadEvents,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _events.length,
        itemBuilder: (_, i) => _EventCard(
          event: _events[i],
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => EventDetailScreen(eventId: _events[i].id),
            ),
          ).then((_) => _loadEvents()),
        ),
      ),
    );
  }
}

class _EventCard extends StatelessWidget {
  final Event event;
  final VoidCallback onTap;

  const _EventCard({required this.event, required this.onTap});

  static const _primaryColor = Color(0xFF1B5E20);

  Color get _statusColor {
    switch (event.status) {
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
    final fmt = DateFormat('d MMM, HH:mm', 'ru');
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(event.title,
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis),
                  ),
                  const SizedBox(width: 8),
                  _StatusChip(label: event.statusDisplay, color: _statusColor),
                ],
              ),
              const SizedBox(height: 10),
              _InfoRow(icon: Icons.location_on_outlined, text: event.location),
              const SizedBox(height: 6),
              _InfoRow(
                  icon: Icons.calendar_today_outlined,
                  text: fmt.format(event.startDateTime)),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.group_outlined, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    '${event.currentVolunteers} / ${event.maxVolunteers} волонтеров',
                    style: const TextStyle(fontSize: 13, color: Colors.grey),
                  ),
                  const Spacer(),
                  if (event.isFull)
                    const Chip(
                      label: Text('Нет мест',
                          style: TextStyle(fontSize: 11, color: Colors.white)),
                      backgroundColor: Colors.red,
                      padding: EdgeInsets.zero,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                ],
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: event.maxVolunteers > 0
                      ? event.currentVolunteers / event.maxVolunteers
                      : 0,
                  backgroundColor: Colors.grey.shade200,
                  valueColor: AlwaysStoppedAnimation(
                      event.isFull ? Colors.red : _primaryColor),
                  minHeight: 5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final Color color;
  const _StatusChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.4)),
      ),
      child: Text(label,
          style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 15, color: Colors.grey),
        const SizedBox(width: 6),
        Expanded(
          child: Text(text,
              style: const TextStyle(fontSize: 13, color: Colors.grey),
              maxLines: 1,
              overflow: TextOverflow.ellipsis),
        ),
      ],
    );
  }
}
