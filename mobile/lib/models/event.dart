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
  final DateTime? updatedAt;

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
    this.updatedAt,
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    return Event(
      id: json['id'] as int,
      title: json['title'] as String,
      description: json['description'] as String,
      location: json['location'] as String,
      startDateTime: DateTime.parse(json['startDateTime'] as String),
      endDateTime: DateTime.parse(json['endDateTime'] as String),
      maxVolunteers: json['maxVolunteers'] as int,
      currentVolunteers: json['currentVolunteers'] as int? ?? 0,
      status: (json['status'] as String).toLowerCase(),
      createdBy: json['createdBy'] as int,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
    );
  }

  bool get isFull => currentVolunteers >= maxVolunteers;
  bool get isPublished => status == 'published';
  bool get isDraft => status == 'draft';
  bool get isCompleted => status == 'completed';

  String get statusDisplay {
    switch (status) {
      case 'published':
        return 'Опубликовано';
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
      'title': title,
      'description': description,
      'location': location,
      'startDateTime': startDateTime.toIso8601String(),
      'endDateTime': endDateTime.toIso8601String(),
      'maxVolunteers': maxVolunteers,
      'currentVolunteers': currentVolunteers,
      'status': status,
      'createdBy': createdBy,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
