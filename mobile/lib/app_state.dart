import 'package:flutter/material.dart';
import 'models/user.dart';

const kPrimary = Color(0xFFFF6B00);
const kPrimaryHover = Color(0xFFE55F00);

class UserState extends ChangeNotifier {
  User? _user;
  User? get user => _user;
  bool get isHr {
    final role = _user?.role ?? '';
    return role == 'HR' || role == 'ADMIN' || role == 'SUPER_ADMIN';
  }

  void setUser(User? u) {
    _user = u;
    notifyListeners();
  }

  void clear() {
    _user = null;
    notifyListeners();
  }
}