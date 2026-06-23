import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../main.dart';
import '../models/registration_request.dart';
import '../services/api_service.dart';

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({super.key});

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  static const _tabs = [
    _Tab(key: 'PENDING', label: 'Ожидают'),
    _Tab(key: 'APPROVED', label: 'Принятые'),
    _Tab(key: 'REJECTED', label: 'Отклонённые'),
  ];

  String _activeTab = 'PENDING';
  List<RegistrationRequest> _items = [];
  bool _loading = true;
  String? _error;
  int? _actionLoading;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = context.read<ApiService>();
      final data = await api.getRegistrationRequests(status: _activeTab);
      if (mounted) setState(() { _items = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() {
        _error = 'Не удалось загрузить заявки';
        _loading = false;
      });
    }
  }

  void _switchTab(String key) {
    if (_activeTab == key) return;
    setState(() => _activeTab = key);
    _load();
  }

  Future<void> _approve(RegistrationRequest r) async {
    setState(() => _actionLoading = r.id);
    try {
      final api = context.read<ApiService>();
      final res = await api.approveRegistration(r.id);
      if (!mounted) return;
      final uid = res['uniqueId'] ?? '—';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Заявка принята. ID: $uid'),
          backgroundColor: Colors.green,
        ),
      );
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Ошибка: ${e.toString().replaceAll('Exception: ', '')}'),
              backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _actionLoading = null);
    }
  }

  Future<void> _rejectWithDialog(RegistrationRequest r) async {
    final controller = TextEditingController();
    final comment = await showDialog<String?>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Отклонить заявку'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${r.lastName} ${r.firstName} — ${r.email}',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
            const SizedBox(height: 10),
            TextField(
              controller: controller,
              maxLines: 3,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Причина отклонения...',
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
            onPressed: () => Navigator.pop(ctx, null),
            child: const Text('Отмена'),
          ),
          ElevatedButton(
            onPressed: () {
              final t = controller.text.trim();
              if (t.isEmpty) return;
              Navigator.pop(ctx, t);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Отклонить', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (comment == null) return;

    setState(() => _actionLoading = r.id);
    try {
      final api = context.read<ApiService>();
      await api.rejectRegistration(r.id, comment);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Заявка отклонена'), backgroundColor: Colors.orange),
      );
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Ошибка: ${e.toString().replaceAll('Exception: ', '')}'),
              backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _actionLoading = null);
    }
  }

  void _openDetails(RegistrationRequest r) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _RequestDetailScreen(
          request: r,
          onApprove: _approve,
          onReject: _rejectWithDialog,
          isActionLoading: () => _actionLoading == r.id,
        ),
      ),
    ).then((_) => _load());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: const Text('Заявки на вступление',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: kPrimary,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _load,
            tooltip: 'Обновить',
          ),
        ],
      ),
      body: Column(
        children: [
          _buildTabs(),
          Expanded(child: _buildList()),
        ],
      ),
    );
  }

  Widget _buildTabs() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Row(
        children: _tabs.map((tab) {
          final selected = tab.key == _activeTab;
          return Expanded(
            child: InkWell(
              onTap: () => _switchTab(tab.key),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: selected ? kPrimary : Colors.transparent,
                      width: 2,
                    ),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Flexible(
                      child: Text(
                        tab.label,
                        textAlign: TextAlign.center,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            fontSize: 13,
                            fontWeight: selected ? FontWeight.bold : FontWeight.w500,
                            color: selected ? kPrimary : Colors.grey.shade600),
                      ),
                    ),
                    if (selected && !_loading) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding:
                            const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: kPrimary,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text('${_items.length}',
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildList() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: kPrimary));
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 48),
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _load,
                style: ElevatedButton.styleFrom(backgroundColor: kPrimary),
                child: const Text('Повторить', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      );
    }
    if (_items.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.inbox_outlined, size: 64, color: Colors.grey),
            const SizedBox(height: 12),
            const Text('Пусто',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(_emptyMessage(),
                style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      color: kPrimary,
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _items.length,
        itemBuilder: (ctx, i) => _buildCard(_items[i]),
      ),
    );
  }

  String _emptyMessage() {
    switch (_activeTab) {
      case 'PENDING':
        return 'Нет новых заявок';
      case 'APPROVED':
        return 'Нет принятых заявок';
      case 'REJECTED':
        return 'Нет отклонённых заявок';
      default:
        return '';
    }
  }

  Widget _buildCard(RegistrationRequest r) {
    final isLoading = _actionLoading == r.id;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE8E8E8)),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _openDetails(r),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: const BoxDecoration(
                      color: Color(0xFFF5F5F5),
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      r.initials.isEmpty ? '?' : r.initials,
                      style: TextStyle(
                          color: Colors.grey.shade700,
                          fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(r.fullName,
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 14),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 2),
                        Text('Заявка #${r.id}',
                            style: TextStyle(
                                fontSize: 11, color: Colors.grey.shade500)),
                      ],
                    ),
                  ),
                  _statusBadge(r.status),
                ],
              ),
              const SizedBox(height: 10),
              _kv('Email', r.email),
              _kv('Телефон', r.phone),
              if (r.iin != null && r.iin!.isNotEmpty) _kv('ИИН', r.iin!),
              if (r.studyPlace != null && r.studyPlace!.isNotEmpty)
                _kv('Учёба', r.studyPlace!),
              if (r.assemblyName != null && r.assemblyName!.isNotEmpty)
                _kv('Отделение', r.assemblyName!),
              if (r.motivation != null && r.motivation!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFAFAFA),
                    borderRadius: BorderRadius.circular(8),
                    border: const Border(
                      left: BorderSide(color: kPrimary, width: 3),
                    ),
                  ),
                  child: Text(
                    r.motivation!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade700,
                        fontStyle: FontStyle.italic),
                  ),
                ),
              ],
              if (r.status == 'PENDING') ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: isLoading ? null : () => _approve(r),
                        icon: const Icon(Icons.check,
                            size: 16, color: Colors.white),
                        label: Text(isLoading ? 'Обработка...' : 'Принять',
                            style: const TextStyle(color: Colors.white)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                          elevation: 0,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: isLoading ? null : () => _rejectWithDialog(r),
                        icon: const Icon(Icons.close,
                            size: 16, color: Colors.red),
                        label: const Text('Отклонить',
                            style: TextStyle(color: Colors.red)),
                        style: OutlinedButton.styleFrom(
                          backgroundColor: Colors.red.shade50,
                          side: BorderSide(color: Colors.red.shade200),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _statusBadge(String status) {
    Color bg, fg;
    switch (status) {
      case 'APPROVED':
        bg = const Color(0xFFE8F5E9);
        fg = const Color(0xFF2E7D32);
        break;
      case 'REJECTED':
        bg = const Color(0xFFFFEBEE);
        fg = const Color(0xFFC62828);
        break;
      default:
        bg = const Color(0xFFFFF8E1);
        fg = const Color(0xFFEF6C00);
    }
    String label = status == 'PENDING'
        ? 'Ожидает'
        : status == 'APPROVED'
            ? 'Принята'
            : status == 'REJECTED'
                ? 'Отклонена'
                : status;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(label,
          style: TextStyle(
              fontSize: 11, fontWeight: FontWeight.w600, color: fg)),
    );
  }

  Widget _kv(String k, String v) {
    return Padding(
      padding: const EdgeInsets.only(top: 3),
      child: RichText(
        text: TextSpan(
          style: const TextStyle(fontSize: 12, color: Color(0xFF666666)),
          children: [
            TextSpan(
                text: '$k: ',
                style: TextStyle(color: Colors.grey.shade500)),
            TextSpan(text: v),
          ],
        ),
      ),
    );
  }
}

class _Tab {
  final String key;
  final String label;
  const _Tab({required this.key, required this.label});
}

class _RequestDetailScreen extends StatelessWidget {
  final RegistrationRequest request;
  final Future<void> Function(RegistrationRequest) onApprove;
  final Future<void> Function(RegistrationRequest) onReject;
  final bool Function() isActionLoading;

  const _RequestDetailScreen({
    required this.request,
    required this.onApprove,
    required this.onReject,
    required this.isActionLoading,
  });

  @override
  Widget build(BuildContext context) {
    final r = request;
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: Text(r.fullName,
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: kPrimary,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _header(r),
            const SizedBox(height: 12),
            _section('Контакты', [
              _row('Телефон', r.phone),
              _row('Email', r.email),
              _row('Instagram', r.instagram),
              _row('Отделение', r.assemblyName),
            ]),
            const SizedBox(height: 12),
            _section('Личные данные', [
              _row(
                  'Дата рождения',
                  r.birthDate != null
                      ? DateFormat('dd.MM.yyyy').format(r.birthDate!)
                      : null),
              _row('ИИН', r.iin),
              _row('Место учёбы', r.studyPlace),
              _row('Место работы', r.workPlace),
              _row('Свободные дни', r.freeDays),
              _row('Языки', r.languages),
            ]),
            const SizedBox(height: 12),
            _section('О себе', [
              _row('Опыт волонтёрства', r.volunteeringExperience),
              _row('Хобби и интересы', r.hobbies),
              _row('Интересные мероприятия', r.interestedEvents),
              _row('Как узнал о нас', r.discoverySource),
              _row('Почему хочет вступить', r.motivation),
            ]),
            if (r.hrComment != null || r.reviewedAt != null) ...[
              const SizedBox(height: 12),
              _section('Решение HR', [
                _row(
                    'Когда рассмотрено',
                    r.reviewedAt != null
                        ? DateFormat('dd.MM.yyyy HH:mm').format(r.reviewedAt!)
                        : null),
                _row('Комментарий HR', r.hrComment),
              ]),
            ],
            const SizedBox(height: 20),
            if (r.status == 'PENDING')
              StatefulBuilder(
                builder: (ctx, _) {
                  final loading = isActionLoading();
                  return Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: loading
                              ? null
                              : () async {
                                  await onApprove(r);
                                  if (ctx.mounted) Navigator.pop(ctx);
                                },
                          icon: const Icon(Icons.check,
                              size: 18, color: Colors.white),
                          label: Text(loading ? 'Обработка...' : 'Принять',
                              style: const TextStyle(color: Colors.white)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10)),
                            elevation: 0,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: loading
                              ? null
                              : () async {
                                  await onReject(r);
                                  if (ctx.mounted) Navigator.pop(ctx);
                                },
                          icon: const Icon(Icons.close,
                              size: 18, color: Colors.red),
                          label: const Text('Отклонить',
                              style: TextStyle(color: Colors.red)),
                          style: OutlinedButton.styleFrom(
                            backgroundColor: Colors.red.shade50,
                            side: BorderSide(color: Colors.red.shade200),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _header(RegistrationRequest r) {
    Color bg, fg;
    switch (r.status) {
      case 'APPROVED':
        bg = const Color(0xFFE8F5E9);
        fg = const Color(0xFF2E7D32);
        break;
      case 'REJECTED':
        bg = const Color(0xFFFFEBEE);
        fg = const Color(0xFFC62828);
        break;
      default:
        bg = const Color(0xFFFFF8E1);
        fg = const Color(0xFFEF6C00);
    }
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE8E8E8)),
      ),
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: const BoxDecoration(
              color: Color(0xFFF5F5F5),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(r.initials.isEmpty ? '?' : r.initials,
                style: TextStyle(
                    color: Colors.grey.shade700,
                    fontWeight: FontWeight.bold,
                    fontSize: 16)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(r.fullName,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 4),
                Text(
                  'Заявка #${r.id}'
                  '${r.createdAt != null ? " · ${DateFormat('dd.MM.yyyy HH:mm').format(r.createdAt!)}" : ""}',
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(r.statusDisplay,
                style: TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w600, color: fg)),
          ),
        ],
      ),
    );
  }

  Widget _section(String title, List<Widget> rows) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE8E8E8)),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title.toUpperCase(),
              style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey.shade500,
                  letterSpacing: 0.5)),
          const SizedBox(height: 8),
          ...rows,
        ],
      ),
    );
  }

  Widget _row(String label, String? value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
          const SizedBox(height: 2),
          Text(
            (value != null && value.trim().isNotEmpty) ? value : '—',
            style: const TextStyle(fontSize: 13, color: Color(0xFF1A1A1A)),
          ),
        ],
      ),
    );
  }
}
