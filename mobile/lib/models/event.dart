class Event {
  final int id;
  final String title;
  final String description;
  final String location;
  final DateTime startDateTime;
  final DateTime endDateTime;
  final int maxVolunteers;
  final int currentVolunteers;
  final String status;
  final int createdBy;
  final DateTime createdAt;

  Event({
    required this.id,
    required this.title,
    required this.description,
    required this.location,
    required this.startDateTime,
    required this.endDateTime,
    required this.maxVolunteers,
    required this.currentVolunteers,
    required this.status,
    required this.createdBy,
    required this.createdAt,
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    // Комбинируй eventDate + startTime в startDateTime
    final eventDate = json['eventDate'] ?? '2026-01-01';
    final startTime = json['startTime'] ?? '00:00:00';
    final endTime = json['endTime'] ?? '01:00:00';
    
    return Event(
      id: json['id'] as int,
      title: json['eventName'] as String? ?? 'Без названия',
      description: json['description'] as String? ?? '',
      location: json['location'] as String? ?? '',
      startDateTime: DateTime.parse('$eventDate $startTime'),
      endDateTime: DateTime.parse('$eventDate $endTime'),
      maxVolunteers: json['maxParticipants'] as int? ?? 0,
      currentVolunteers: json['currentParticipants'] as int? ?? 0,
      status: (json['status'] as String?)?.toLowerCase() ?? 'draft',
      createdBy: json['createdById'] as int? ?? 0,
      createdAt: DateTime.now(), // Нет в ответе, используй now()
    );
  }

  bool get isFull => currentVolunteers >= maxVolunteers;
  bool get isPublished => status == 'open';
  bool get isDraft => status == 'draft';
  bool get isCompleted => status == 'completed';

  String get statusDisplay {
    switch (status) {
      case 'open':
        return 'Открыто';
      case 'draft':
        return 'Черновик';
      case 'completed':
        return 'Завершено';
      case 'cancelled':
        return 'Отменено';
      default:
        return status;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'eventName': title,
      'description': description,
      'location': location,
      'startDateTime': startDateTime.toIso8601String(),
      'endDateTime': endDateTime.toIso8601String(),
      'maxParticipants': maxVolunteers,
      'currentParticipants': currentVolunteers,
      'status': status,
      'createdById': createdBy,
    };
  }
}