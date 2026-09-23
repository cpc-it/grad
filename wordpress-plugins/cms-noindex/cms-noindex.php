<?php
/**
 * Plugin Name: CMS Noindex and Host Redirect
 * Description: Keeps WordPress CMS hosts out of search results and redirects the WP Engine hostname to the CMS hostname.
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
	exit;
}

const CMS_NOINDEX_HOST = 'cms.grad.calpoly.edu';
const CMS_LEGACY_HOST = 'bpgrad.wpenginepowered.com';

function cms_noindex_redirect_legacy_host() {
	$host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
	$host = preg_replace('/:\d+$/', '', $host);

	if ($host !== CMS_LEGACY_HOST) {
		return;
	}

	$path = (string) ($_SERVER['REQUEST_URI'] ?? '/');
	wp_redirect('https://' . CMS_NOINDEX_HOST . $path, 301);
	exit;
}
add_action('template_redirect', 'cms_noindex_redirect_legacy_host', 1);

function cms_noindex_send_header() {
	$host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
	$host = preg_replace('/:\d+$/', '', $host);

	if ($host === CMS_NOINDEX_HOST || $host === CMS_LEGACY_HOST) {
		header('X-Robots-Tag: noindex, nofollow, noarchive', true);
	}
}
add_action('send_headers', 'cms_noindex_send_header');

function cms_noindex_robots($robots) {
	$robots['noindex'] = true;
	$robots['nofollow'] = true;
	$robots['noarchive'] = true;
	return $robots;
}
add_filter('wp_robots', 'cms_noindex_robots');

function cms_noindex_robots_txt($output) {
	return "User-agent: *\nDisallow: /\n";
}
add_filter('robots_txt', 'cms_noindex_robots_txt', 10, 1);
