import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';
import 'services/api_service.dart';
import 'models/user.dart';
import 'screens/login_screen.dart';
import 'screens/events_list_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/qr_checkin_screen.dart';
import 'widgets/app_drawer.dart';

const kPrimary = Color(0xFFFF6B00);
const kPrimaryHover = Color(0xFFE55F00);

class UserState extends ChangeNotifier {
  User? _user;
  User? get user => _user;

  bool get isHr =>
      _user?.role == 'HR' ||
      _user?.role == 'ADMIN' ||
      _user?.role == 'SUPER_ADMIN';

  void setUser(User? user) {
    _user = user;
    notifyListeners();
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('ru', null);
  runApp(
    MultiProvider(
      providers: [
        Provider<ApiService>(create: (_) => ApiService()),
        ChangeNotifierProvider<UserState>(create: (_) => UserState()),
      ],
      child: const SmartAssemblyApp(),
    ),
  );
}

/// Reads the URL hash on web to detect QR checkin: /#/checkin/{id}
int? _parseCheckinId() {
  try {
    final fragment = Uri.base.fragment; // e.g. "/checkin/3"
    final match = RegExp(r'^/checkin/(\d+)$').firstMatch(fragment);
    if (match != null) return int.tryParse(match.group(1)!);
  } catch (_) {}
  return null;
}

class SmartAssemblyApp extends StatelessWidget {
  const SmartAssemblyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final checkinId = _parseCheckinId();
    return MaterialApp(
      title: 'Ассамблея Жастары',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: kPrimary),
        useMaterial3: true,
        fontFamily: 'Roboto',
        appBarTheme: const AppBarTheme(elevation: 0),
      ),
      home: checkinId != null
          ? QrCheckinScreen(eventId: checkinId)
          : const AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _checking = true;
  bool _isLoggedIn = false;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final api = context.read<ApiService>();
    final loggedIn = await api.isLoggedIn();
    if (loggedIn) {
      try {
        final user = await api.getMe();
        if (mounted) context.read<UserState>().setUser(user);
      } catch (_) {}
    }
    if (mounted) {
      setState(() {
        _isLoggedIn = loggedIn;
        _checking = false;
      });
    }
  }

  Future<void> _handleLoginSuccess() async {
    final api = context.read<ApiService>();
    try {
      final user = await api.getMe();
      if (mounted) context.read<UserState>().setUser(user);
    } catch (_) {}
    if (mounted) setState(() => _isLoggedIn = true);
  }

  @override
  Widget build(BuildContext context) {
    if (_checking) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: kPrimary),
              SizedBox(height: 16),
              Text('Загрузка...', style: TextStyle(color: Colors.grey)),
            ],
          ),
        ),
      );
    }

    if (!_isLoggedIn) {
      return LoginScreen(
        onLoginSuccess: () => _handleLoginSuccess(),
      );
    }

    return HomeScreen(
      onLogout: () {
        context.read<UserState>().setUser(null);
        setState(() => _isLoggedIn = false);
      },
    );
  }
}

class HomeScreen extends StatefulWidget {
  final VoidCallback onLogout;

  const HomeScreen({super.key, required this.onLogout});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      const EventsListScreen(),
      ProfileScreen(onLogout: widget.onLogout),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: AppDrawer(
        onLogout: widget.onLogout,
        currentIndex: _currentIndex,
        onNavTap: (i) => setState(() => _currentIndex = i),
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        indicatorColor: kPrimary.withOpacity(0.15),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.event_outlined),
            selectedIcon: Icon(Icons.event, color: kPrimary),
            label: 'Мероприятия',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: kPrimary),
            label: 'Профиль',
          ),
        ],
      ),
    );
  }
}
