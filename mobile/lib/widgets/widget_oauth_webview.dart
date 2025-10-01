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

  void _initializeWebViewController() {
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
          final messageContent = message.message;
          if (mounted) {
            if (messageContent.isNotEmpty && messageContent != 'NO_TOKEN') {
              if (messageContent.startsWith('NO_TOKEN:')) {
                final url = messageContent.substring(9);
                final token = _extractTokenFromUrl(url);
                if (token != null && token.isNotEmpty) {
                  Navigator.pop(context, token);
                } else {
                  _showTokenNotFoundError();
                }
              } else {
                Navigator.pop(context, messageContent);
              }
            } else {
              _showTokenNotFoundError();
            }
          }
        },
      )
      ..loadRequest(Uri.parse(widget.oauthUrl));

    _configureCookieSettings();
  }

  Future<void> _configureCookieSettings() async {
    try {
      await webViewController.runJavaScript('''
        var originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
                                     Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');
        
        if (originalCookieDescriptor && originalCookieDescriptor.configurable) {
          Object.defineProperty(document, 'cookie', {
            get: function() {
              try {
                var result = originalCookieDescriptor.get.call(this);
                return result;
              } catch (e) {
                throw e;
              }
            },
            set: originalCookieDescriptor.set,
            configurable: true
          });
        }
      ''');
    } catch (e) {
      print('Could not configure cookie debugging: $e');
    }
  }

  void _tryExtractTokenFromPage() async {
    try {
      await webViewController.runJavaScript('''
        (function() {
          var token = null;

          try {
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
          } catch (cookieError) {
            var urlParams = new URLSearchParams(window.location.search);
            token = urlParams.get('token') || urlParams.get('auth_token');
            if (!token && window.location.hash) {
              var hashParams = new URLSearchParams(window.location.hash.substring(1));
              token = hashParams.get('token') || hashParams.get('auth_token');
            }
            
            try {
              if (!token && window.localStorage) {
                token = localStorage.getItem('auth_token') || localStorage.getItem('token');
              }
            } catch (storageError) {
              
            }
            try {
              if (!token && window.sessionStorage) {
                token = sessionStorage.getItem('auth_token') || sessionStorage.getItem('token');
              }
            } catch (storageError) {
              
            }
          }

          if (token) {
            OAuthTokenExtractor.postMessage(token);
          } else {
            OAuthTokenExtractor.postMessage('NO_TOKEN:' + window.location.href);
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
          var authToken = null;
          
          try {
            var cookies = document.cookie.split(';');
            
            for (var i = 0; i < cookies.length; i++) {
              var cookie = cookies[i].trim();
              if (cookie.indexOf('auth_token=') === 0) {
                authToken = cookie.substring('auth_token='.length);
                break;
              }
            }
          } catch (cookieError) {
            var urlParams = new URLSearchParams(window.location.search);
            authToken = urlParams.get('token') || urlParams.get('auth_token');
            
            if (!authToken && window.location.hash) {
              var hashParams = new URLSearchParams(window.location.hash.substring(1));
              authToken = hashParams.get('token') || hashParams.get('auth_token');
            }
            
            try {
              if (!authToken && window.localStorage) {
                authToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
              }
            } catch (storageError) {
              
            }
            
            try {
              if (!authToken && window.sessionStorage) {
                authToken = sessionStorage.getItem('auth_token') || sessionStorage.getItem('token');
              }
            } catch (storageError) {
              
            }
          }
          
          if (authToken) {
            OAuthTokenExtractor.postMessage(authToken);
          } else {
            OAuthTokenExtractor.postMessage('NO_TOKEN:' + window.location.href);
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
      print('Error parsing URL for token: $e');
      return null;
    }
  }

  void _showTokenNotFoundError() {
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

  void _handleRedirect(String url) async {
    try {
      final token = _extractTokenFromUrl(url);
      if (token != null && token.isNotEmpty) {
        Navigator.pop(context, token);
        return;
      }

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
