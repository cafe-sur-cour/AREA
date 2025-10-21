import 'package:area/core/config/app_config.dart';
import 'package:area/l10n/app_localizations.dart';
import 'package:area/services/secure_storage.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

class MobileOAuthService {
  static Future<bool> handleServiceSubscription({
    required BuildContext context,
    required String backendAddress,
    required String subscriptionUrl,
    required String serviceName,
  }) async {
    try {
      final result = await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (context) => ServiceSubscriptionWebView(
            subscriptionUrl: subscriptionUrl,
            serviceName: serviceName,
          ),
        ),
      );

      return result ?? false;
    } catch (e) {
      if (context.mounted) {
        _showError(context, 'Service subscription failed: $e');
      }
      return false;
    }
  }

  static bool _isSubscriptionSuccess(String callbackUrl) {
    try {
      final uri = Uri.parse(callbackUrl);
      return uri.queryParameters.values.any(
        (value) =>
            value.toLowerCase() == 'true' &&
            uri.queryParameters.keys.any(
              (key) =>
                  key.toLowerCase().contains('subscribed') ||
                  key.toLowerCase().contains('success') ||
                  key.toLowerCase().contains('connected'),
            ),
      );
    } catch (e) {
      return false;
    }
  }

  static void _showError(BuildContext context, String message) {
    if (!context.mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 3),
      ),
    );
  }
}

class ServiceSubscriptionWebView extends StatefulWidget {
  final String subscriptionUrl;
  final String serviceName;

  const ServiceSubscriptionWebView({
    super.key,
    required this.subscriptionUrl,
    required this.serviceName,
  });

  @override
  State<ServiceSubscriptionWebView> createState() => _ServiceSubscriptionWebViewState();
}

class _ServiceSubscriptionWebViewState extends State<ServiceSubscriptionWebView> {
  WebViewController? _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _initializeWebView() async {
    final cookieManager = WebViewCookieManager();
    final jwt = await getJwt();

    if (jwt != null) {
      cookieManager.setCookie(
        WebViewCookie(name: 'auth_token', value: jwt, domain: widget.subscriptionUrl),
      );
    }

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..enableZoom(true)
      ..setUserAgent(
        'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36',
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
            });
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
          },
          onNavigationRequest: (NavigationRequest request) {
            if (request.url.startsWith(AppConfig.callBackUrl)) {
              _handleCallback(request.url);
              return NavigationDecision.prevent;
            }

            if (request.url.contains('github.com/apps/')) {
              _openExternalBrowser(request.url);
              return NavigationDecision.prevent;
            }

            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.subscriptionUrl));
  }

  void _handleCallback(String callbackUrl) {
    final isSuccess = MobileOAuthService._isSubscriptionSuccess(callbackUrl);
    Navigator.of(context).pop(isSuccess);
  }

  Future<void> _openExternalBrowser(String url) async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Complete ${widget.serviceName} setup in your browser, then return to the app.',
              ),
              duration: const Duration(seconds: 5),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalizations.of(context)!.failed_open_browser(e.toString())),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.of(context)!.connect_service(widget.serviceName)),
        actions: [
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
        ],
      ),
      body: _controller == null
          ? const Center(child: CircularProgressIndicator())
          : WebViewWidget(controller: _controller!),
    );
  }
}
