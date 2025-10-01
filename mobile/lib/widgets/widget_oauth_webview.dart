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

    webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
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

            if (url.startsWith(widget.redirectUrl)) {
              _tryExtractTokenFromPage();
            }
          },
          onNavigationRequest: (NavigationRequest request) {
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
      ..addJavaScriptChannel(
        'OAuthTokenExtractor',
        onMessageReceived: (JavaScriptMessage message) {
          final token = message.message;
          if (mounted) {
            if (token.isNotEmpty && token != 'NO_TOKEN') {
              Navigator.pop(context, token);
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'No authentication token found in cookies',
                    style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
                  ),
                  backgroundColor: AppColors.error,
                ),
              );
              Navigator.pop(context);
            }
          }
        },
      )
      ..loadRequest(Uri.parse(widget.oauthUrl));
  }

  void _tryExtractTokenFromPage() async {
    try {
      await webViewController.runJavaScript('''
        (function() {
          var token = null;

          if (document.cookie) {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
              var cookie = cookies[i].trim();
              if (cookie.indexOf('auth_token=') === 0) {
                token = cookie.substring('auth_token='.length);
                break;
              }
            }
          }

          if (token) {
            OAuthTokenExtractor.postMessage(token);
          }
        })();
      ''');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to extract authentication token',
              style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
            ),
            backgroundColor: AppColors.error,
          ),
        );
        Navigator.pop(context);
      }
    }
  }

  Future<void> _extractTokenFromCookies() async {
    try {
      await webViewController.runJavaScript('''
        (function() {
          var cookies = document.cookie.split(';');
          var authToken = null;
          
          for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.indexOf('auth_token=') === 0) {
              authToken = cookie.substring('auth_token='.length);
              break;
            }
          }
          
          if (authToken) {
            console.log('Found auth_token in cookies');
            OAuthTokenExtractor.postMessage(authToken);
          } else {
            console.log('No auth_token found in cookies');
            OAuthTokenExtractor.postMessage('NO_TOKEN');
          }
        })();
      ''');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to extract authentication token',
              style: TextStyle(color: AppColors.areaLightGray, fontSize: 16),
            ),
            backgroundColor: AppColors.error,
          ),
        );
        Navigator.pop(context);
      }
    }
  }

  void _handleRedirect(String url) async {
    try {
      await _extractTokenFromCookies();
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
