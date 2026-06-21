import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../main.dart' show kPrimary, UserState;
import '../models/event.dart';
import '../services/api_service.dart';
import 'event_detail_screen.dart';
import 'event_create_screen.dart';

class EventsListScreen extends StatefulWidget {
  const EventsListScreen({super.key});

  @override
  State<EventsListScreen> createState() => _EventsListScreenState();
}

class _EventsListScreenState extends State<EventsListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Event> _events = [];
  bool _loading = false;
  String? _error;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) setState(() {});
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _initialized = true;
      _loadEvents();
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  bool get _isHr => context.read<UserState>().isHr;

  Future<void> _loadEvents() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = context.read<ApiService>();
      final events = _isHr ? await api.getHrEvents() : await api.getEvents();
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

  List<Event> get _filteredEvents {
    final idx = _tabController.index;
    if (_isHr) {
      if (idx == 0) {
        return _events
            .where((e) => e.status == 'OPEN' || e.status == 'IN_PROGRESS')
            .toList();
      }
      if (idx == 1) return _events.where((e) => e.status == 'DRAFT').toList();
      return _events
          .where((e) => e.status == 'COMPLETED' || e.status == 'CANCELLED')
          .toList()
        ..sort((a, b) => b.startDateTime.compareTo(a.startDateTime));
    } else {
      if (idx == 0) {
        return _events
            .where((e) => e.status == 'OPEN' || e.status == 'IN_PROGRESS')
            .toList();
      }
      if (idx == 1) return _events.where((e) => e.isRegistered).toList();
      return _events
          .where((e) => e.status == 'COMPLETED' || e.status == 'CANCELLED')
          .toList()
        ..sort((a, b) => b.startDateTime.compareTo(a.startDateTime));
    }
  }

  int _count(int idx) {
    if (_isHr) {
      if (idx == 0) {
        return _events
            .where((e) => e.status == 'OPEN' || e.status == 'IN_PROGRESS')
            .length;
      }
      if (idx == 1) return _events.where((e) => e.status == 'DRAFT').length;
      return _events
          .where((e) => e.status == 'COMPLETED' || e.status == 'CANCELLED')
          .length;
    } else {
      if (idx == 0) {
        return _events
            .where((e) => e.status == 'OPEN' || e.status == 'IN_PROGRESS')
            .length;
      }
      if (idx == 1) return _events.where((e) => e.isRegistered).length;
      return _events
          .where((e) => e.status == 'COMPLETED' || e.status == 'CANCELLED')
          .length;
    }
  }

  List<String> get _tabLabels {
    if (_isHr) {
      return [
        'Активные (${_count(0)})',
        'Черновики (${_count(1)})',
        'История (${_count(2)})',
      ];
    }
    return [
      'Все мероприятия',
      'Мои отклики (${_count(1)})',
      'История (${_count(2)})',
    ];
  }

  @override
  Widget build(BuildContext context) {
    context.watch<UserState>();

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: Text(
          _isHr ? 'Управление мероприятиями' : 'Мероприятия',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        backgroundColor: kPrimary,
        iconTheme: const IconThemeData(color: Colors.white),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          labelStyle:
              const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
          unselectedLabelStyle: const TextStyle(fontSize: 13),
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          tabs: _tabLabels.map((l) => Tab(text: l)).toList(),
        ),
      ),
      floatingActionButton: _isHr
          ? FloatingActionButton.extended(
              onPressed: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => const EventCreateScreen()),
                );
                _loadEvents();
              },
              backgroundColor: kPrimary,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add),
              label: const Text(
                'Создать мероприятие',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
            )
          : null,
      body: _buildBody(),
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
                onPressed: _loadEvents,
                icon: const Icon(Icons.refresh),
                label: const Text('Повторить'),
                style: ElevatedButton.styleFrom(
                    backgroundColor: kPrimary, foregroundColor: Colors.white),
              ),
            ],
          ),
        ),
      );
    }

    return TabBarView(
      controller: _tabController,
      children: List.generate(3, (_) => _buildTab()),
    );
  }

  Widget _buildTab() {
    final events = _filteredEvents;
    if (events.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.event_busy, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              _emptyMessage(),
              style: const TextStyle(fontSize: 16, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: _loadEvents,
              icon: const Icon(Icons.refresh, color: kPrimary),
              label: const Text('Обновить',
                  style: TextStyle(color: kPrimary)),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      color: kPrimary,
      onRefresh: _loadEvents,
      child: ListView.builder(
        padding: EdgeInsets.fromLTRB(16, 16, 16, _isHr ? 96 : 16),
        itemCount: events.length,
        itemBuilder: (_, i) {
          final event = events[i];
          final isHistory = _tabController.index == 2;
          return _EventCard(
            event: event,
            isHr: _isHr,
            isHistory: isHistory,
            onTap: () async {
              await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => EventDetailScreen(eventId: event.id),
                ),
              );
              _loadEvents();
            },
            onRegister: () async {
              try {
                final api = context.read<ApiService>();
                if (event.isRegistered) {
                  await api.unregisterEvent(event.id);
                } else {
                  await api.registerEvent(event.id);
                }
                _loadEvents();
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    content:
                        Text(e.toString().replaceAll('Exception: ', '')),
                    backgroundColor: Colors.red,
                    behavior: SnackBarBehavior.floating,
                  ));
                }
              }
            },
          );
        },
      ),
    );
  }

  String _emptyMessage() {
    final idx = _tabController.index;
    if (_isHr) {
      if (idx == 0) return 'Нет активных мероприятий';
      if (idx == 1) return 'Нет черновиков';
      return 'Нет завершённых мероприятий';
    } else {
      if (idx == 0) return 'Ближайших мероприятий пока нет';
      if (idx == 1) return 'Вы ещё не откликались\nни на одно мероприятие';
      return 'Нет завершённых мероприятий';
    }
  }
}

// ── Карточка мероприятия ──────────────────────────────────────────────────────

class _EventCard extends StatelessWidget {
  final Event event;
  final bool isHr;
  final bool isHistory;
  final VoidCallback onTap;
  final VoidCallback onRegister;

  const _EventCard({
    required this.event,
    required this.isHr,
    required this.isHistory,
    required this.onTap,
    required this.onRegister,
  });

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('dd.MM.yyyy · HH:mm', 'ru');
    final dateStr = fmt.format(event.startDateTime);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE8E8E8)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(10),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Тип мероприятия + статус-бейдж (для истории/черновиков)
              Row(
                children: [
                  if (event.eventType != null &&
                      event.eventTypeDisplay.isNotEmpty) ...[
                    _TypeBadge(label: event.eventTypeDisplay),
                    const SizedBox(width: 8),
                  ],
                  if (isHistory || event.isDraft)
                    _StatusChip(event: event),
                ],
              ),
              if (event.eventType != null || isHistory || event.isDraft)
                const SizedBox(height: 8),

              // Название
              Text(
                event.eventName,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A1A1A),
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),

              // Дата
              Row(children: [
                const Icon(Icons.calendar_today_outlined,
                    size: 14, color: Color(0xFF999999)),
                const SizedBox(width: 6),
                Text(dateStr,
                    style: const TextStyle(
                        fontSize: 13, color: Color(0xFF666666))),
              ]),

              // Место
              if (event.location.isNotEmpty) ...[
                const SizedBox(height: 4),
                Row(children: [
                  const Icon(Icons.location_on_outlined,
                      size: 14, color: Color(0xFF999999)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      event.location,
                      style: const TextStyle(
                          fontSize: 13, color: Color(0xFF666666)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ]),
              ],

              // Кнопка "Откликнуться" только для волонтёра на активных
              if (!isHr && !isHistory) ...[
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: event.isRegistered
                      ? OutlinedButton(
                          onPressed: onRegister,
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF666666),
                            side: const BorderSide(color: Color(0xFFE8E8E8)),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: const Text('Отменить участие'),
                        )
                      : ElevatedButton(
                          onPressed: event.isFull ? null : onRegister,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: kPrimary,
                            foregroundColor: Colors.white,
                            disabledBackgroundColor: const Color(0xFFE8E8E8),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            elevation: 0,
                          ),
                          child: Text(
                            event.isFull ? 'Мест нет' : 'Откликнуться',
                            style: const TextStyle(
                                fontWeight: FontWeight.w600),
                          ),
                        ),
                ),
              ],
            ],
          ),
        ),
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

class _StatusChip extends StatelessWidget {
  final Event event;
  const _StatusChip({required this.event});

  Color get _bg {
    switch (event.status) {
      case 'COMPLETED':
        return const Color(0xFFE8F5E9);
      case 'CANCELLED':
        return const Color(0xFFFFEBEE);
      case 'DRAFT':
        return const Color(0xFFF5F5F5);
      default:
        return const Color(0xFFFFF3E0);
    }
  }

  Color get _fg {
    switch (event.status) {
      case 'COMPLETED':
        return const Color(0xFF2E7D32);
      case 'CANCELLED':
        return const Color(0xFFC62828);
      case 'DRAFT':
        return const Color(0xFF666666);
      default:
        return kPrimary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: _bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        event.statusDisplay,
        style: TextStyle(
            fontSize: 12, fontWeight: FontWeight.w500, color: _fg),
      ),
    );
  }
}
