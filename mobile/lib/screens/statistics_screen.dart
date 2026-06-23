import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../main.dart';
import '../models/hours_history.dart';
import '../services/api_service.dart';

class StatisticsScreen extends StatefulWidget {
  const StatisticsScreen({super.key});

  @override
  State<StatisticsScreen> createState() => _StatisticsScreenState();
}

class _StatisticsScreenState extends State<StatisticsScreen> {
  static const int _pageSize = 20;

  HoursSummary? _summary;
  List<HoursTransaction> _history = [];
  int _totalElements = 0;
  bool _loading = true;
  String? _error;

  String _typeFilter = '';
  DateTime? _dateFrom;
  DateTime? _dateTo;
  int _page = 0;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    setState(() { _loading = true; _error = null; });
    final api = context.read<ApiService>();
    try {
      _summary = await api.getMyHoursSummary();
    } catch (_) {}
    await _loadHistory(showLoader: false);
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _loadHistory({bool showLoader = true}) async {
    if (showLoader) setState(() { _loading = true; _error = null; });
    final api = context.read<ApiService>();
    try {
      final page = await api.getMyHoursHistory(
        type: _typeFilter.isEmpty ? null : _typeFilter,
        from: _dateFrom != null ? DateFormat('yyyy-MM-dd').format(_dateFrom!) : null,
        to: _dateTo != null ? DateFormat('yyyy-MM-dd').format(_dateTo!) : null,
        page: _page,
        size: _pageSize,
      );
      if (mounted) {
        setState(() {
          _history = page.items;
          _totalElements = page.totalElements;
          if (showLoader) _loading = false;
        });
      }
    } catch (_) {
      if (_summary?.breakdown.isNotEmpty == true) {
        if (mounted) {
          setState(() {
            _history = _summary!.breakdown;
            _totalElements = _summary!.breakdown.length;
            if (showLoader) _loading = false;
          });
        }
      } else if (mounted) {
        setState(() {
          _error = 'Не удалось загрузить историю часов';
          if (showLoader) _loading = false;
        });
      }
    }
  }

  void _applyFilters() {
    _page = 0;
    _loadHistory();
  }

  void _resetFilters() {
    setState(() {
      _typeFilter = '';
      _dateFrom = null;
      _dateTo = null;
      _page = 0;
    });
    _loadHistory();
  }

  double get _monthHours {
    final now = DateTime.now();
    final list = _summary?.breakdown ?? [];
    return list
        .where((t) =>
            t.createdAt != null &&
            t.createdAt!.year == now.year &&
            t.createdAt!.month == now.month)
        .fold(0.0, (sum, t) => sum + (t.hoursDelta > 0 ? t.hoursDelta : 0));
  }

  int get _totalPages =>
      _totalElements == 0 ? 1 : ((_totalElements + _pageSize - 1) ~/ _pageSize);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: const Text('Статистика часов',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: kPrimary,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadAll,
            tooltip: 'Обновить',
          ),
        ],
      ),
      body: RefreshIndicator(
        color: kPrimary,
        onRefresh: _loadAll,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Полная история начислений и корректировок',
                  style: TextStyle(fontSize: 13, color: Color(0xFF666666))),
              const SizedBox(height: 16),
              _buildSummaryRow(),
              const SizedBox(height: 12),
              _buildFiltersCard(),
              const SizedBox(height: 12),
              _buildHistoryCard(),
              if (_totalPages > 1) ...[
                const SizedBox(height: 16),
                _buildPagination(),
              ],
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _card({required Widget child, EdgeInsets? padding}) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE8E8E8)),
      ),
      padding: padding ?? const EdgeInsets.all(16),
      child: child,
    );
  }

  Widget _buildSummaryRow() {
    final total = _summary?.totalHours ?? 0;
    return Row(
      children: [
        Expanded(child: _summaryTile(total.toStringAsFixed(1), 'Всего часов', kPrimary)),
        const SizedBox(width: 8),
        Expanded(child: _summaryTile(_monthHours.toStringAsFixed(1), 'За месяц', const Color(0xFF1A1A1A))),
        const SizedBox(width: 8),
        Expanded(child: _summaryTile('$_totalElements', 'Записей', const Color(0xFF666666))),
      ],
    );
  }

  Widget _summaryTile(String value, String label, Color color) {
    return _card(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 6),
      child: Column(
        children: [
          Text(value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                  fontSize: 26, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 4),
          Text(label,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11, color: Color(0xFF999999))),
        ],
      ),
    );
  }

  Widget _buildFiltersCard() {
    final hasFilter = _typeFilter.isNotEmpty || _dateFrom != null || _dateTo != null;
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Фильтры',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 12),
          _filterLabel('Тип'),
          const SizedBox(height: 4),
          _typeDropdown(),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _filterLabel('С даты'),
                    const SizedBox(height: 4),
                    _dateField(_dateFrom, (d) => setState(() => _dateFrom = d)),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _filterLabel('По дату'),
                    const SizedBox(height: 4),
                    _dateField(_dateTo, (d) => setState(() => _dateTo = d)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: _applyFilters,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kPrimary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                    elevation: 0,
                  ),
                  child: const Text('Применить',
                      style: TextStyle(fontWeight: FontWeight.w600)),
                ),
              ),
              if (hasFilter) ...[
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: _resetFilters,
                    style: OutlinedButton.styleFrom(
                      backgroundColor: Colors.grey.shade100,
                      foregroundColor: Colors.grey.shade700,
                      side: BorderSide(color: Colors.grey.shade300),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('Сбросить',
                        style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _filterLabel(String text) =>
      Text(text, style: const TextStyle(fontSize: 12, color: Color(0xFF999999)));

  Widget _typeDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFE8E8E8)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          isExpanded: true,
          value: _typeFilter,
          icon: const Icon(Icons.keyboard_arrow_down, color: Colors.grey),
          style: const TextStyle(fontSize: 14, color: Color(0xFF1A1A1A)),
          items: const [
            DropdownMenuItem(value: '', child: Text('Все')),
            DropdownMenuItem(value: 'EVENT', child: Text('Мероприятия')),
            DropdownMenuItem(
                value: 'MANUAL_ADJUSTMENT', child: Text('Корректировки')),
            DropdownMenuItem(value: 'PENALTY', child: Text('Штрафы')),
          ],
          onChanged: (v) => setState(() => _typeFilter = v ?? ''),
        ),
      ),
    );
  }

  Widget _dateField(DateTime? value, ValueChanged<DateTime?> onChange) {
    final text = value != null
        ? DateFormat('dd.MM.yyyy').format(value)
        : 'дд.мм.гггг';
    return InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: () async {
        final now = DateTime.now();
        final picked = await showDatePicker(
          context: context,
          initialDate: value ?? now,
          firstDate: DateTime(now.year - 5),
          lastDate: DateTime(now.year + 1),
          builder: (ctx, child) => Theme(
            data: Theme.of(ctx).copyWith(
              colorScheme: const ColorScheme.light(primary: kPrimary),
            ),
            child: child!,
          ),
        );
        if (picked != null) onChange(picked);
      },
      child: Container(
        height: 42,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          border: Border.all(color: const Color(0xFFE8E8E8)),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(text,
                  style: TextStyle(
                      fontSize: 14,
                      color: value != null
                          ? const Color(0xFF1A1A1A)
                          : Colors.grey.shade400)),
            ),
            if (value != null)
              GestureDetector(
                onTap: () => onChange(null),
                child: Icon(Icons.close, size: 16, color: Colors.grey.shade500),
              )
            else
              Icon(Icons.calendar_today, size: 14, color: Colors.grey.shade400),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE8E8E8)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                const Expanded(
                  child: Text('История',
                      style: TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 14)),
                ),
                if (_totalElements > 0)
                  Text('$_totalElements записей',
                      style: TextStyle(
                          fontSize: 12, color: Colors.grey.shade500)),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE8E8E8)),
          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Center(child: CircularProgressIndicator(color: kPrimary)),
            )
          else if (_error != null)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(_error!, style: const TextStyle(color: Colors.red)),
            )
          else if (_history.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 48),
              child: Center(
                child: Text(
                  (_typeFilter.isNotEmpty ||
                          _dateFrom != null ||
                          _dateTo != null)
                      ? 'Нет записей по выбранным фильтрам'
                      : 'История пуста',
                  style: const TextStyle(color: Color(0xFF999999), fontSize: 13),
                ),
              ),
            )
          else
            ..._history
                .asMap()
                .entries
                .map((e) => _buildTransactionRow(e.value, e.key == _history.length - 1)),
        ],
      ),
    );
  }

  Widget _buildTransactionRow(HoursTransaction item, bool isLast) {
    final isPositive = item.hoursDelta >= 0;
    final hours = item.hoursDelta;
    final dateStr = item.createdAt != null
        ? DateFormat('dd.MM.yyyy').format(item.createdAt!)
        : '—';

    Color bg, fg;
    switch (item.type) {
      case 'EVENT':
        bg = const Color(0xFFE3F2FD);
        fg = const Color(0xFF1565C0);
        break;
      case 'MANUAL_ADJUSTMENT':
        bg = const Color(0xFFE8F5E9);
        fg = const Color(0xFF2E7D32);
        break;
      case 'PENALTY':
        bg = const Color(0xFFFFEBEE);
        fg = const Color(0xFFC62828);
        break;
      default:
        bg = Colors.grey.shade100;
        fg = Colors.grey.shade700;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : const Border(
                bottom: BorderSide(color: Color(0xFFE8E8E8), width: 1)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(item.typeDisplay,
                style: TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w600, color: fg)),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w500)),
                if (item.eventName != null &&
                    (item.reason ?? item.note) != null) ...[
                  const SizedBox(height: 2),
                  Text(item.reason ?? item.note!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          fontSize: 11, color: Colors.grey.shade500)),
                ],
                if (item.createdBy != null) ...[
                  const SizedBox(height: 2),
                  Text('Корректировал: ${item.createdBy}',
                      style: TextStyle(
                          fontSize: 11, color: Colors.grey.shade500)),
                ],
                const SizedBox(height: 2),
                Text(dateStr,
                    style: TextStyle(
                        fontSize: 11, color: Colors.grey.shade500)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '${isPositive ? '+' : ''}${hours.toStringAsFixed(2)}ч',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: isPositive
                  ? const Color(0xFF2E7D32)
                  : const Color(0xFFC62828),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPagination() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        OutlinedButton(
          onPressed: _page > 0
              ? () {
                  setState(() => _page--);
                  _loadHistory();
                }
              : null,
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: Color(0xFFE8E8E8)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          ),
          child: const Text('← Назад', style: TextStyle(fontSize: 13)),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text('${_page + 1} из $_totalPages',
              style: const TextStyle(fontSize: 13, color: Color(0xFF999999))),
        ),
        OutlinedButton(
          onPressed: _page < _totalPages - 1
              ? () {
                  setState(() => _page++);
                  _loadHistory();
                }
              : null,
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: Color(0xFFE8E8E8)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          ),
          child: const Text('Вперёд →', style: TextStyle(fontSize: 13)),
        ),
      ],
    );
  }
}
