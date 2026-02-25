import 'package:flutter/material.dart';

class CatalogLoadingView extends StatelessWidget {
  const CatalogLoadingView({super.key, this.message});

  final String? message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            if ((message ?? '').isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                message!,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class CatalogErrorView extends StatelessWidget {
  const CatalogErrorView({
    super.key,
    required this.message,
    this.onRetry,
    this.compact = false,
  });

  final String message;
  final VoidCallback? onRetry;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final child = _CatalogStateCard(
      icon: Icons.error_outline,
      title: 'Something went wrong',
      subtitle: message,
      actionLabel: onRetry != null ? 'Retry' : null,
      onAction: onRetry,
    );

    if (compact) return child;
    return Center(
      child: Padding(padding: const EdgeInsets.all(16), child: child),
    );
  }
}

class CatalogEmptyView extends StatelessWidget {
  const CatalogEmptyView({
    super.key,
    required this.title,
    required this.subtitle,
    this.icon = Icons.inventory_2_outlined,
    this.actionLabel,
    this.onAction,
    this.compact = false,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onAction;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final child = _CatalogStateCard(
      icon: icon,
      title: title,
      subtitle: subtitle,
      actionLabel: actionLabel,
      onAction: onAction,
    );
    if (compact) return child;
    return Center(
      child: Padding(padding: const EdgeInsets.all(16), child: child),
    );
  }
}

class CatalogInlineMessageCard extends StatelessWidget {
  const CatalogInlineMessageCard({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      elevation: 0,
      color: Colors.grey.shade50,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(padding: const EdgeInsets.all(16), child: child),
    );
  }
}

class _CatalogStateCard extends StatelessWidget {
  const _CatalogStateCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return CatalogInlineMessageCard(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 32, color: Colors.black45),
          const SizedBox(height: 10),
          Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: Colors.black54),
            textAlign: TextAlign.center,
          ),
          if ((actionLabel ?? '').isNotEmpty && onAction != null) ...[
            const SizedBox(height: 12),
            OutlinedButton(onPressed: onAction, child: Text(actionLabel!)),
          ],
        ],
      ),
    );
  }
}
