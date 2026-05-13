import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

const String API_BASE = 'http://your-backend.render.com/api';

void main() {
  runApp(const TileHubApp());
}

class TileHubApp extends StatelessWidget {
  const TileHubApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TileHub Pro',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF16a34a)),
        fontFamily: 'Inter',
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black87,
          elevation: 0,
          centerTitle: false,
        ),
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        ),
      ),
      initialRoute: '/login',
      routes: {
        '/login': (_) => const LoginScreen(),
        '/catalog': (_) => const CatalogScreen(),
        '/calculator': (_) => const CalculatorScreen(),
        '/inquiry': (_) => const InquiryScreen(),
        '/warehouse': (_) => const WarehouseHomeScreen(),
        '/scanner': (_) => const QRScannerScreen(),
      },
    );
  }
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

class AuthService {
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  static Future<Map<String, String>> authHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  bool _otpSent = false;
  bool _loading = false;
  String _error = '';

  Future<void> _sendOTP() async {
    setState(() { _loading = true; _error = ''; });
    try {
      final res = await http.post(
        Uri.parse('$API_BASE/auth/send-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phone': _phoneCtrl.text}),
      );
      if (res.statusCode == 200) {
        setState(() { _otpSent = true; });
      } else {
        setState(() { _error = jsonDecode(res.body)['error'] ?? 'Failed'; });
      }
    } catch (_) {
      setState(() { _error = 'Network error'; });
    } finally {
      setState(() { _loading = false; });
    }
  }

  Future<void> _verifyOTP() async {
    setState(() { _loading = true; _error = ''; });
    try {
      final res = await http.post(
        Uri.parse('$API_BASE/auth/verify-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phone': _phoneCtrl.text, 'otp': _otpCtrl.text}),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        await AuthService.saveToken(data['token']);
        final role = data['user']['role'];
        if (mounted) {
          Navigator.pushReplacementNamed(
            context,
            role == 'warehouse' ? '/warehouse' : '/catalog',
          );
        }
      } else {
        setState(() { _error = jsonDecode(res.body)['error'] ?? 'Invalid OTP'; });
      }
    } catch (_) {
      setState(() { _error = 'Network error'; });
    } finally {
      setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 60),
              RichText(text: TextSpan(
                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.black87),
                children: [
                  const TextSpan(text: 'Tile'),
                  TextSpan(text: 'Hub', style: TextStyle(color: Theme.of(context).colorScheme.primary)),
                  const TextSpan(text: ' Pro'),
                ],
              )),
              const SizedBox(height: 6),
              const Text('Sign in with your phone number', style: TextStyle(color: Colors.grey, fontSize: 14)),
              const SizedBox(height: 40),
              TextField(
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                enabled: !_otpSent,
                decoration: const InputDecoration(labelText: 'Phone number', prefixText: '+91 '),
              ),
              if (_otpSent) ...[
                const SizedBox(height: 16),
                TextField(
                  controller: _otpCtrl,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 22, letterSpacing: 8, fontWeight: FontWeight.bold),
                  decoration: const InputDecoration(labelText: 'Enter OTP', counterText: ''),
                ),
              ],
              if (_error.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(_error, style: const TextStyle(color: Colors.red, fontSize: 13)),
              ],
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _loading ? null : (_otpSent ? _verifyOTP : _sendOTP),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: _loading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(_otpSent ? 'Verify OTP' : 'Send OTP', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
              if (_otpSent) ...[
                TextButton(
                  onPressed: () => setState(() { _otpSent = false; _otpCtrl.clear(); }),
                  child: const Text('← Change number'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ─── CATALOG SCREEN ───────────────────────────────────────────────────────────

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key});
  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  List products = [];
  bool loading = true;
  String search = '';
  int _navIndex = 0;

  @override
  void initState() {
    super.initState();
    _fetchProducts();
  }

  Future<void> _fetchProducts() async {
    final headers = await AuthService.authHeaders();
    final uri = Uri.parse('$API_BASE/products').replace(queryParameters: search.isEmpty ? {} : {'search': search});
    final res = await http.get(uri, headers: headers);
    if (res.statusCode == 200) {
      setState(() { products = jsonDecode(res.body)['products'] ?? []; loading = false; });
    }
  }

  final List<Widget> _screens = const [_CatalogBody(), CalculatorScreen(), InquiryScreen()];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _navIndex == 0
        ? _CatalogBody(onSearchChanged: (v) { search = v; _fetchProducts(); }, products: products, loading: loading)
        : _screens[_navIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _navIndex,
        onDestinationSelected: (i) => setState(() => _navIndex = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.grid_view), label: 'Catalog'),
          NavigationDestination(icon: Icon(Icons.calculate), label: 'Calculator'),
          NavigationDestination(icon: Icon(Icons.chat_bubble_outline), label: 'Inquiry'),
        ],
      ),
    );
  }
}

class _CatalogBody extends StatelessWidget {
  final Function(String)? onSearchChanged;
  final List products;
  final bool loading;
  const _CatalogBody({this.onSearchChanged, this.products = const [], this.loading = false});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: RichText(text: TextSpan(
        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black87),
        children: [const TextSpan(text: 'Tile'), TextSpan(text: 'Hub', style: TextStyle(color: Theme.of(context).colorScheme.primary)), const TextSpan(text: ' Pro')],
      ))),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              onChanged: onSearchChanged,
              decoration: InputDecoration(
                hintText: 'Search tiles...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.grey.shade100,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
          ),
          Expanded(
            child: loading
              ? const Center(child: CircularProgressIndicator())
              : GridView.builder(
                  padding: const EdgeInsets.all(12),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 0.75, crossAxisSpacing: 10, mainAxisSpacing: 10),
                  itemCount: products.length,
                  itemBuilder: (ctx, i) {
                    final p = products[i];
                    return Card(
                      clipBehavior: Clip.antiAlias,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: Container(color: Colors.grey.shade100, child: Center(child: Icon(Icons.grid_3x3, size: 48, color: Colors.grey.shade300)))),
                          Padding(
                            padding: const EdgeInsets.all(8),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(p['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                                Text('${p['finish']} · ${p['material']}', style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
                                const SizedBox(height: 4),
                                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                                  Text('₹${p['price_per_sqft']}/sqft', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold, fontSize: 13)),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(4)),
                                    child: Text('In stock', style: TextStyle(fontSize: 10, color: Colors.green.shade700)),
                                  ),
                                ]),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
          ),
        ],
      ),
    );
  }
}

// ─── CALCULATOR SCREEN ────────────────────────────────────────────────────────

class CalculatorScreen extends StatefulWidget {
  const CalculatorScreen({super.key});
  @override
  State<CalculatorScreen> createState() => _CalculatorScreenState();
}

class _CalculatorScreenState extends State<CalculatorScreen> {
  final _lenCtrl = TextEditingController();
  final _widCtrl = TextEditingController();
  double _tileArea = 0.36;
  double _wastage = 10;
  Map<String, dynamic>? _result;

  void _calculate() {
    final l = double.tryParse(_lenCtrl.text);
    final w = double.tryParse(_widCtrl.text);
    if (l == null || w == null) return;
    final areaSqm = l * w;
    final areaSqft = areaSqm * 10.764;
    final withWastage = areaSqft * (1 + _wastage / 100);
    final tiles = (areaSqm * (1 + _wastage / 100) / _tileArea).ceil();
    final boxes = (withWastage / 10).ceil();
    setState(() { _result = { 'areaSqm': areaSqm.toStringAsFixed(2), 'areaSqft': areaSqft.toStringAsFixed(1), 'withWastage': withWastage.toStringAsFixed(1), 'tiles': tiles, 'boxes': boxes }; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tile Calculator')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Room Dimensions', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: TextField(controller: _lenCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Length (m)'))),
              const SizedBox(width: 12),
              Expanded(child: TextField(controller: _widCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Width (m)'))),
            ]),
            const SizedBox(height: 16),
            DropdownButtonFormField<double>(
              value: _tileArea,
              decoration: const InputDecoration(labelText: 'Tile size'),
              items: const [
                DropdownMenuItem(value: 0.04, child: Text('20×20 cm')),
                DropdownMenuItem(value: 0.09, child: Text('30×30 cm')),
                DropdownMenuItem(value: 0.18, child: Text('30×60 cm')),
                DropdownMenuItem(value: 0.36, child: Text('60×60 cm')),
              ],
              onChanged: (v) => setState(() => _tileArea = v!),
            ),
            const SizedBox(height: 12),
            Text('Wastage: ${_wastage.toInt()}%'),
            Slider(value: _wastage, min: 5, max: 25, divisions: 8, onChanged: (v) => setState(() => _wastage = v)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _calculate,
              style: ElevatedButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.primary, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
              child: const Text('Calculate', style: TextStyle(fontSize: 16)),
            ),
            if (_result != null) ...[
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.green.shade200)),
                child: Column(children: [
                  Row(children: [
                    _ResultCard('${_result!['boxes']}', 'Boxes needed', context),
                    const SizedBox(width: 12),
                    _ResultCard('${_result!['tiles']}', 'Tiles needed', context),
                  ]),
                  const SizedBox(height: 12),
                  _Row('Room area', '${_result!['areaSqm']} m² (${_result!['areaSqft']} sqft)'),
                  _Row('With wastage', '${_result!['withWastage']} sqft'),
                ]),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _ResultCard(String val, String label, BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
      child: Column(children: [
        Text(val, style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary)),
        Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
      ]),
    ),
  );

  Widget _Row(String l, String v) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(l, style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
      Text(v, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
    ]),
  );
}

// ─── INQUIRY SCREEN ───────────────────────────────────────────────────────────

class InquiryScreen extends StatefulWidget {
  const InquiryScreen({super.key});
  @override
  State<InquiryScreen> createState() => _InquiryScreenState();
}

class _InquiryScreenState extends State<InquiryScreen> {
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _dimCtrl = TextEditingController();
  final _msgCtrl = TextEditingController();
  bool _loading = false;
  bool _submitted = false;

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      final res = await http.post(
        Uri.parse('$API_BASE/quotations'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({ 'customer_name': _nameCtrl.text, 'customer_phone': _phoneCtrl.text, 'room_dimensions': _dimCtrl.text, 'message': _msgCtrl.text }),
      );
      if (res.statusCode == 201) setState(() => _submitted = true);
    } finally { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    if (_submitted) {
      return Scaffold(
        body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Text('🎉', style: TextStyle(fontSize: 64)),
          const SizedBox(height: 16),
          const Text('Inquiry Submitted!', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('We will call you within 24 hours.', style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 24),
          TextButton(onPressed: () => setState(() => _submitted = false), child: const Text('Submit another')),
        ])),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Get a Quote')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Your name *')),
          const SizedBox(height: 12),
          TextField(controller: _phoneCtrl, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone number *')),
          const SizedBox(height: 12),
          TextField(controller: _dimCtrl, decoration: const InputDecoration(labelText: 'Room dimensions', hintText: 'e.g. 12×10 ft living room')),
          const SizedBox(height: 12),
          TextField(controller: _msgCtrl, maxLines: 3, decoration: const InputDecoration(labelText: 'Message / requirements', alignLabelWithHint: true)),
          const SizedBox(height: 20),
          SizedBox(width: double.infinity, child: ElevatedButton(
            onPressed: _loading ? null : _submit,
            style: ElevatedButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.primary, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            child: _loading ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2) : const Text('Send Inquiry', style: TextStyle(fontSize: 16)),
          )),
        ]),
      ),
    );
  }
}

// ─── WAREHOUSE HOME ───────────────────────────────────────────────────────────

class WarehouseHomeScreen extends StatefulWidget {
  const WarehouseHomeScreen({super.key});
  @override
  State<WarehouseHomeScreen> createState() => _WarehouseHomeScreenState();
}

class _WarehouseHomeScreenState extends State<WarehouseHomeScreen> {
  List shipments = [];
  bool loading = true;

  @override
  void initState() { super.initState(); _fetchShipments(); }

  Future<void> _fetchShipments() async {
    final headers = await AuthService.authHeaders();
    final res = await http.get(Uri.parse('$API_BASE/shipments?status=pending'), headers: headers);
    if (res.statusCode == 200) {
      setState(() { shipments = jsonDecode(res.body); loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shipment Queue'),
        actions: [IconButton(icon: const Icon(Icons.qr_code_scanner), onPressed: () => Navigator.pushNamed(context, '/scanner').then((_) => _fetchShipments()))],
      ),
      body: loading
        ? const Center(child: CircularProgressIndicator())
        : shipments.isEmpty
          ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Text('✅', style: TextStyle(fontSize: 48)),
              const SizedBox(height: 12),
              const Text('No pending shipments', style: TextStyle(color: Colors.grey)),
              ElevatedButton.icon(onPressed: () => Navigator.pushNamed(context, '/scanner'), icon: const Icon(Icons.qr_code_scanner), label: const Text('Open Scanner')),
            ]))
          : ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: shipments.length,
              itemBuilder: (ctx, i) {
                final s = shipments[i];
                return Card(
                  child: ListTile(
                    title: Text(s['shipment_number'] ?? '', style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w600)),
                    subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(s['customer_name'] ?? ''),
                      Text(s['delivery_address'] ?? '', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                    ]),
                    trailing: ElevatedButton(
                      onPressed: () => Navigator.pushNamed(context, '/scanner'),
                      child: const Text('Scan'),
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.pushNamed(context, '/scanner').then((_) => _fetchShipments()),
        icon: const Icon(Icons.qr_code_scanner),
        label: const Text('Scan QR'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
    );
  }
}

// ─── QR SCANNER SCREEN ───────────────────────────────────────────────────────

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});
  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  bool _scanned = false;
  bool _loading = false;
  String _result = '';
  bool _success = false;

  Future<void> _onQRDetect(BarcodeCapture capture) async {
    if (_scanned || _loading) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode?.rawValue == null) return;
    setState(() { _scanned = true; _loading = true; });

    try {
      final headers = await AuthService.authHeaders();
      final res = await http.post(
        Uri.parse('$API_BASE/shipments/scan'),
        headers: headers,
        body: jsonEncode({'qr_data': barcode!.rawValue}),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() { _result = '${data['shipment']['shipment_number']} dispatched. Stock updated!'; _success = true; });
      } else {
        setState(() { _result = jsonDecode(res.body)['error'] ?? 'Error'; _success = false; });
      }
    } catch (_) {
      setState(() { _result = 'Network error'; _success = false; });
    } finally {
      setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_scanned) {
      return Scaffold(
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                _loading
                  ? const CircularProgressIndicator()
                  : Text(_success ? '✅' : '❌', style: const TextStyle(fontSize: 72)),
                const SizedBox(height: 16),
                Text(_result, textAlign: TextAlign.center, style: TextStyle(fontSize: 16, color: _success ? Colors.green.shade700 : Colors.red.shade700)),
                const SizedBox(height: 32),
                if (!_loading) ...[
                  ElevatedButton(
                    onPressed: () { setState(() { _scanned = false; _result = ''; }); },
                    style: ElevatedButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.primary, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14)),
                    child: const Text('Scan Next'),
                  ),
                  const SizedBox(height: 12),
                  TextButton(onPressed: () => Navigator.pop(context), child: const Text('Back to Shipments')),
                ],
              ]),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Scan Shipment QR')),
      body: MobileScanner(onDetect: _onQRDetect),
    );
  }
}
