class Event {
  final int id;
  final String eventName;
  final String description;
  final String location;
  final DateTime startDateTime;
  final DateTime endDateTime;
  final int maxVolunteers;
  final int currentVolunteers;
  final String status;
  final String? eventType;
  final bool isRegistered;
  final String? checkInTime;
  final List<String> speakers;
  final String? dressCode;
  final String? objectives;
  final String? tasks;
  final String? coordinatorName;
  final String? createdByName;

  Event({
    required this.id,
    required this.eventName,
    required this.description,
    required this.location,
    required this.startDateTime,
    required this.endDateTime,
    required this.maxVolunteers,
    required this.currentVolunteers,
    required this.status,
    this.eventType,
    this.isRegistered = false,
    this.checkInTime,
    this.speakers = const [],
    this.dressCode,
    this.objectives,
    this.tasks,
    this.coordinatorName,
    this.createdByName,
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    final eventDate = json['eventDate'] as String? ?? '2026-01-01';
    final startTime = json['startTime'] as String? ?? '00:00:00';
    final endTime = json['endTime'] as String? ?? '01:00:00';

    DateTime safeDate(String time) {
      try {
        final t = time.length >= 5 ? time.substring(0, 5) : time;
        return DateTime.parse('$eventDate $t:00');
      } catch (_) {
        return DateTime.now();
      }
    }

    List<String> speakers = [];
    final raw = json['speakers'];
    if (raw is List) {
      speakers = raw
          .map((s) => s.toString().trim())
          .where((s) => s.isNotEmpty)
          .toList();
    } else if (raw is String && raw.isNotEmpty) {
      speakers = raw
          .split(',')
          .map((s) => s.trim())
          .where((s) => s.isNotEmpty)
          .toList();
    }

    return Event(
      id: json['id'] as int,
      eventName: json['eventName'] as String? ?? 'Без названия',
      description: json['description'] as String? ?? '',
      location: json['location'] as String? ?? '',
      startDateTime: safeDate(startTime),
      endDateTime: safeDate(endTime),
      maxVolunteers: json['maxParticipants'] as int? ?? 0,
      currentVolunteers: json['currentParticipants'] as int? ?? 0,
      status: json['status'] as String? ?? 'DRAFT',
      eventType: json['eventType'] as String?,
      isRegistered: json['isRegistered'] as bool? ?? false,
      checkInTime: json['checkInTime'] as String?,
      speakers: speakers,
      dressCode: json['dressCode'] as String?,
      objectives: json['objectives'] as String?,
      tasks: json['tasks'] as String?,
      coordinatorName: json['coordinatorName'] as String?,
      createdByName: json['createdByName'] as String?,
    );
  }

  bool get isFull => maxVolunteers > 0 && currentVolunteers >= maxVolunteers;
  bool get isDraft => status == 'DRAFT';
  bool get isCompleted => status == 'COMPLETED';
  bool get isActive =>
      status == 'OPEN' || status == 'IN_PROGRESS' || status == 'CLOSED';

  String get statusDisplay {
    switch (status) {
      case 'OPEN':
        return 'Открыта запись';
      case 'DRAFT':
        return 'Черновик';
      case 'IN_PROGRESS':
        return 'Идёт сейчас';
      case 'COMPLETED':
        return 'Завершено';
      case 'CANCELLED':
        return 'Отменено';
      case 'CLOSED':
        return 'Запись закрыта';
      default:
        return status;
    }
  }

  String get eventTypeDisplay {
    switch (eventType) {
      case 'CONFERENCE':
        return 'Конференция';
      case 'ROUNDTABLE':
        return 'Круглый стол';
      case 'WORKSHOP':
        return 'Воркшоп';
      case 'CHARITY':
        return 'Благотворительность';
      case 'CULTURAL':
        return 'Культурное';
      case 'EDUCATIONAL':
        return 'Образовательное';
      default:
        return eventType ?? '';
    }
  }

  Map<String, dynamic> toJson() => {
        'eventName': eventName,
        'description': description,
        'location': location,
        'maxParticipants': maxVolunteers,
        'status': status,
        'eventType': eventType,
        'dressCode': dressCode,
        'objectives': objectives,
        'tasks': tasks,
        'speakers': speakers,
      };
}
