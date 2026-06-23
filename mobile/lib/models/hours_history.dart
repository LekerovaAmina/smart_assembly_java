class HoursTransaction {
  final int? id;
  final String type;
  final double hoursDelta;
  final String? eventName;
  final String? reason;
  final String? note;
  final String? createdBy;
  final DateTime? createdAt;

  HoursTransaction({
    this.id,
    required this.type,
    required this.hoursDelta,
    this.eventName,
    this.reason,
    this.note,
    this.createdBy,
    this.createdAt,
  });

  factory HoursTransaction.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic v) {
      if (v == null) return null;
      try {
        return DateTime.parse(v as String);
      } catch (_) {
        return null;
      }
    }

    final hours = (json['hoursDelta'] ?? json['hours'] ?? 0);
    final delta = (hours is num) ? hours.toDouble() : double.tryParse(hours.toString()) ?? 0.0;

    String inferType() {
      final t = json['type'] as String?;
      if (t != null && t.isNotEmpty) return t;
      return delta >= 0 ? 'EVENT' : 'PENALTY';
    }

    return HoursTransaction(
      id: (json['id'] as num?)?.toInt(),
      type: inferType(),
      hoursDelta: delta,
      eventName: (json['eventName'] ?? json['title']) as String?,
      reason: json['reason'] as String?,
      note: json['note'] as String?,
      createdBy: json['createdBy'] as String?,
      createdAt: parseDate(json['createdAt'] ?? json['date']),
    );
  }

  String get typeDisplay {
    switch (type) {
      case 'EVENT':
        return 'Мероприятие';
      case 'MANUAL_ADJUSTMENT':
        return 'Корректировка';
      case 'PENALTY':
        return 'Штраф';
      default:
        return type;
    }
  }

  String get title =>
      eventName?.isNotEmpty == true
          ? eventName!
          : (reason?.isNotEmpty == true ? reason! : '—');
}

class HoursSummary {
  final double totalHours;
  final List<HoursTransaction> breakdown;

  HoursSummary({required this.totalHours, required this.breakdown});

  factory HoursSummary.fromJson(Map<String, dynamic> json) {
    final total = json['totalHours'];
    final totalNum =
        (total is num) ? total.toDouble() : double.tryParse('${total ?? 0}') ?? 0.0;
    final br = json['breakdown'];
    final list = (br is List)
        ? br
            .map((e) => HoursTransaction.fromJson(e as Map<String, dynamic>))
            .toList()
        : <HoursTransaction>[];
    return HoursSummary(totalHours: totalNum, breakdown: list);
  }
}

class HoursHistoryPage {
  final List<HoursTransaction> items;
  final int totalElements;

  HoursHistoryPage({required this.items, required this.totalElements});

  factory HoursHistoryPage.fromJson(dynamic data) {
    if (data is List) {
      final items = data
          .map((e) => HoursTransaction.fromJson(e as Map<String, dynamic>))
          .toList();
      return HoursHistoryPage(items: items, totalElements: items.length);
    }
    if (data is Map<String, dynamic>) {
      final content = data['content'];
      final items = (content is List)
          ? content
              .map((e) => HoursTransaction.fromJson(e as Map<String, dynamic>))
              .toList()
          : <HoursTransaction>[];
      final total = (data['totalElements'] as num?)?.toInt() ?? items.length;
      return HoursHistoryPage(items: items, totalElements: total);
    }
    return HoursHistoryPage(items: const [], totalElements: 0);
  }
}
