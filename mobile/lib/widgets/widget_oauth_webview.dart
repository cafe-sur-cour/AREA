import 'package:area/core/constants/app_colors.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter/material.dart';

class OAuthWebView extends StatefulWidget {
  final String oauthUrl;
  final String redirectUrl;
  final String providerName;

  const OAuthWebView({
    super.key,
    required this.oauthUrl,
    required this.redirectUrl,
    required this.providerName,
  });

  @override
  OAuthWebViewState createState() => OAuthWebViewState();
}

class OAuthWebViewState extends State<OAuthWebView> {
  late final WebViewController webViewController;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _initializeWebViewController();
  }

  void _initializeWebViewController() async {
    webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setUserAgent(
        'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36',
      )
      ..enableZoom(false)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() {
              isLoading = true;
            });
          },
          onPageFinished: (String url) {
            setState(() {
              isLoading = false;
            });
            print("NEW URL: " + url.toString());

            if (url.startsWith(widget.redirectUrl)) {
              _handleRedirect(url);
            }
          },
          onNavigationRequest: (NavigationRequest request) {
            print("NEW URL REQUEST: " + request.url.toString());
            if (request.url.startsWith(widget.redirectUrl)) {
              _handleRedirect(request.url);
              return NavigationDecision.prevent;
            }

            return NavigationDecision.navigate;
          },
          onWebResourceError: (WebResourceError error) {
            setState(() {
              isLoading = false;
            });
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.oauthUrl));
  }

  String? _extractTokenFromUrl(String url) {
    try {
      final uri = Uri.parse(url);

      String? token = uri.queryParameters['token'] ?? uri.queryParameters['auth_token'];

      if (token == null && uri.fragment.isNotEmpty) {
        final fragmentParams = Uri.splitQueryString(uri.fragment);
        token = fragmentParams['token'] ?? fragmentParams['auth_token'];
      }

      if (token == null) {
        final pathSegments = uri.pathSegments;
        for (int i = 0; i < pathSegments.length; i++) {
          if ((pathSegments[i] == 'token' || pathSegments[i] == 'auth_token') &&
              i + 1 < pathSegments.length) {
            token = pathSegments[i + 1];
            break;
          }
        }
      }

      return token;
    } catch (e) {
      return null;
    }
  }

  void _showTokenNotFoundError() {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'No authentication token found. Please try again.',
            style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
          ),
          backgroundColor: AppColors.error,
        ),
      );
      Navigator.pop(context);
    }
  }

  void _handleRedirect(String url) {
    try {
      final token = _extractTokenFromUrl(url);
      if (token != null && token.isNotEmpty) {
        if (mounted) {
          Navigator.pop(context, token);
        }
        return;
      }

      _showTokenNotFoundError();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Authentication failed: ${e.toString()}',
              style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
            ),
            backgroundColor: AppColors.error,
          ),
        );
        Navigator.pop(context);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.providerName} Login'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: webViewController),
          if (isLoading) const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}
