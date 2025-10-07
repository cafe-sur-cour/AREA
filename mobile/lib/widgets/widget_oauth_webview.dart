import 'package:area/core/constants/app_colors.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter/material.dart';
import 'dart:async';

class OAuthWebView extends StatefulWidget {
  final String oauthUrl;
  final String redirectUrl;
  final String providerName;
  final bool Function(String)? onNavigationRequest;

  const OAuthWebView({
    super.key,
    required this.oauthUrl,
    required this.redirectUrl,
    required this.providerName,
    this.onNavigationRequest,
  });

  @override
  OAuthWebViewState createState() => OAuthWebViewState();
}

class OAuthWebViewState extends State<OAuthWebView> {
  WebViewController? webViewController;
  bool isLoading = true;
  bool _isHandlingRedirect = false;
  bool _hasError = false;
  Timer? _timeoutTimer;
  int _retryCount = 0;
  static const int _maxRetries = 2;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _initializeWebViewController();
        _startTimeoutTimer();
      }
    });
  }

  @override
  void dispose() {
    _timeoutTimer?.cancel();
    super.dispose();
  }

  void _startTimeoutTimer() {
    _timeoutTimer = Timer(const Duration(minutes: 5), () {
      if (mounted && !_isHandlingRedirect) {
        _showError('Authentication timeout. Please try again.');
      }
    });
  }

  void _initializeWebViewController() async {
    try {
      webViewController = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setUserAgent(
          'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36',
        )
        ..enableZoom(true)
        ..setBackgroundColor(Colors.white)
        ..setNavigationDelegate(
          NavigationDelegate(
            onPageStarted: (String url) {
              if (mounted) {
                setState(() {
                  isLoading = true;
                });
              }
            },
            onPageFinished: (String url) {
              if (mounted) {
                setState(() {
                  isLoading = false;
                });
              }
            },
            onNavigationRequest: (NavigationRequest request) {
              if (widget.onNavigationRequest != null) {
                final shouldNavigate = widget.onNavigationRequest!(request.url);
                if (!shouldNavigate) {
                  return NavigationDecision.prevent;
                }
              }

              if (request.url.startsWith(widget.redirectUrl)) {
                if (!_isHandlingRedirect) {
                  _handleRedirect(request.url);
                }
                return NavigationDecision.prevent;
              }

              return NavigationDecision.navigate;
            },
            onWebResourceError: (WebResourceError error) {
              if (mounted && !_isHandlingRedirect) {
                setState(() {
                  isLoading = false;
                  _hasError = true;
                });

                if (error.errorCode == -1 ||
                    error.description.toLowerCase().contains('renderer') ||
                    error.description.toLowerCase().contains('crash')) {
                  _handleWebViewCrash();
                } else if (error.errorCode == -2) {
                  if (_retryCount < _maxRetries) {
                    _retryLoad();
                  } else {
                    _showError(
                      'Network connection error. Please check your internet and try again.',
                    );
                  }
                } else if (error.errorCode == -6) {
                  if (_retryCount < _maxRetries) {
                    _retryLoad();
                  } else {
                    _showError(
                      'Cannot connect to authentication server. Please try again later.',
                    );
                  }
                } else {
                  _showError('Authentication error occurred. Please try again.');
                }
              }
            },
            onHttpError: (HttpResponseError error) {
              if (mounted && !_isHandlingRedirect) {
                _showError('Authentication server error. Please try again.');
              }
            },
          ),
        );

      if (mounted) {
        setState(() {});
      }

      await Future.delayed(const Duration(milliseconds: 100));
      await webViewController!.loadRequest(Uri.parse(widget.oauthUrl));
    } catch (e) {
      if (mounted && !_isHandlingRedirect) {
        _showError('Failed to initialize authentication. Please try again.');
      }
    }
  }

  String? _extractTokenFromUrl(String url) {
    try {
      final uri = Uri.parse(url);

      String? token =
          uri.queryParameters['token'] ??
          uri.queryParameters['auth_token'] ??
          uri.queryParameters['jwt'] ??
          uri.queryParameters['access_token'];

      if (token == null && uri.fragment.isNotEmpty) {
        final fragmentParams = Uri.splitQueryString(uri.fragment);
        token =
            fragmentParams['token'] ??
            fragmentParams['auth_token'] ??
            fragmentParams['jwt'] ??
            fragmentParams['access_token'];
      }

      if (token == null) {
        final pathSegments = uri.pathSegments;
        for (int i = 0; i < pathSegments.length; i++) {
          if ((pathSegments[i] == 'token' ||
                  pathSegments[i] == 'auth_token' ||
                  pathSegments[i] == 'jwt') &&
              i + 1 < pathSegments.length) {
            token = pathSegments[i + 1];
            break;
          }
        }
      }

      final hasError = uri.queryParameters['error'] != null;
      if (hasError) {
        final error = uri.queryParameters['error'];
        final errorDescription = uri.queryParameters['error_description'] ?? error;
        throw Exception('OAuth error: $errorDescription');
      }

      return token;
    } catch (e) {
      rethrow;
    }
  }

  void _retryLoad() async {
    if (_retryCount >= _maxRetries || _isHandlingRedirect) return;

    _retryCount++;

    setState(() {
      isLoading = true;
      _hasError = false;
    });

    try {
      await Future.delayed(Duration(milliseconds: 1000 * _retryCount));

      if (mounted && webViewController != null) {
        await webViewController!.loadRequest(Uri.parse(widget.oauthUrl));
      }
    } catch (e) {
      if (mounted) {
        _showError('Retry failed. Please try again.');
      }
    }
  }

  void _handleWebViewCrash() {
    _clearWebViewData();

    if (_retryCount < _maxRetries) {
      _reinitializeWebView();
    } else {
      _showError(
        'Authentication session crashed multiple times. Please restart the app and try again.',
      );
    }
  }

  void _clearWebViewData() async {
    try {
      if (webViewController != null) {
        await webViewController!.clearCache();
        await webViewController!.clearLocalStorage();
      }
    } catch (e) {
      // Ignore cache clearing errors
    }
  }

  void _reinitializeWebView() async {
    _retryCount++;

    setState(() {
      isLoading = true;
      _hasError = false;
    });

    try {
      await Future.delayed(const Duration(milliseconds: 1500));

      if (mounted) {
        _initializeWebViewController();
      }
    } catch (e) {
      if (mounted) {
        _showError('Failed to recover from crash. Please try again.');
      }
    }
  }

  void _showError(String message) {
    if (mounted && !_isHandlingRedirect) {
      _isHandlingRedirect = true;
      _timeoutTimer?.cancel();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message, style: const TextStyle(color: Colors.white, fontSize: 16)),
          backgroundColor: AppColors.error,
          duration: const Duration(seconds: 3),
        ),
      );

      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          Navigator.pop(context);
        }
      });
    }
  }

  void _handleRedirect(String url) {
    if (_isHandlingRedirect) {
      return;
    }

    _isHandlingRedirect = true;
    _timeoutTimer?.cancel();

    try {
      final token = _extractTokenFromUrl(url);

      if (token != null && token.isNotEmpty) {
        if (mounted) {
          Navigator.pop(context, token);
        }
        return;
      }

      _showError('No authentication token found. Please try again.');
    } catch (e) {
      _showError('Authentication failed: ${e.toString()}');
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) {
          _timeoutTimer?.cancel();
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text('${widget.providerName} Login'),
          leading: IconButton(
            icon: const Icon(Icons.close),
            onPressed: () {
              _timeoutTimer?.cancel();
              Navigator.pop(context);
            },
          ),
        ),
        body: Stack(
          children: [
            if (!_hasError && webViewController != null)
              WebViewWidget(controller: webViewController!),
            if (isLoading || webViewController == null)
              const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('Loading authentication...', style: TextStyle(fontSize: 16)),
                  ],
                ),
              ),
            if (_hasError && !isLoading)
              Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 64, color: Colors.red),
                    const SizedBox(height: 16),
                    const Text(
                      'Authentication Error',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _retryCount > 0
                          ? 'Retrying... ($_retryCount/$_maxRetries)'
                          : 'Failed to load authentication',
                      style: const TextStyle(fontSize: 16),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: _retryCount < _maxRetries ? _retryLoad : null,
                      child: Text(_retryCount < _maxRetries ? 'Retry' : 'Max retries reached'),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
