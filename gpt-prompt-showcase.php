<?php
/**
 * Plugin Name:       GPT Prompt Showcase
 * Plugin URI:        https://your-website.com/
 * Description:       Displays custom GPTs in a showcase and provides a prompt-builder form.
 * Version:           1.0.0
 * Author:            Your Name
 * Author URI:        https://your-website.com/
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       gpt-prompt-showcase
 *
 * @package           GPTS
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
    die;
}

/**
 * 1. Register the Custom Post Type 'Custom GPT'.
 */
function gpts_register_cpt() {

    $labels = array(
        'name'                  => _x( 'Custom GPTs', 'Post Type General Name', 'gpt-prompt-showcase' ),
        'singular_name'         => _x( 'Custom GPT', 'Post Type Singular Name', 'gpt-prompt-showcase' ),
        'menu_name'             => __( 'GPT Showcase', 'gpt-prompt-showcase' ),
        'name_admin_bar'        => __( 'Custom GPT', 'gpt-prompt-showcase' ),
        'archives'              => __( 'GPT Archives', 'gpt-prompt-showcase' ),
        'attributes'            => __( 'GPT Attributes', 'gpt-prompt-showcase' ),
        'parent_item_colon'     => __( 'Parent GPT:', 'gpt-prompt-showcase' ),
        'all_items'             => __( 'All GPTs', 'gpt-prompt-showcase' ),
        'add_new_item'          => __( 'Add New GPT', 'gpt-prompt-showcase' ),
        'add_new'               => __( 'Add New', 'gpt-prompt-showcase' ),
        'new_item'              => __( 'New GPT', 'gpt-prompt-showcase' ),
        'edit_item'             => __( 'Edit GPT', 'gpt-prompt-showcase' ),
        'update_item'           => __( 'Update GPT', 'gpt-prompt-showcase' ),
        'view_item'             => __( 'View GPT', 'gpt-prompt-showcase' ),
        'view_items'            => __( 'View GPTs', 'gpt-prompt-showcase' ),
        'search_items'          => __( 'Search GPT', 'gpt-prompt-showcase' ),
        'not_found'             => __( 'Not found', 'gpt-prompt-showcase' ),
        'not_found_in_trash'    => __( 'Not found in Trash', 'gpt-prompt-showcase' ),
        'featured_image'        => __( 'GPT Icon', 'gpt-prompt-showcase' ),
        'set_featured_image'    => __( 'Set GPT icon', 'gpt-prompt-showcase' ),
        'remove_featured_image' => __( 'Remove GPT icon', 'gpt-prompt-showcase' ),
        'use_featured_image'    => __( 'Use as GPT icon', 'gpt-prompt-showcase' ),
        'insert_into_item'      => __( 'Insert into GPT', 'gpt-prompt-showcase' ),
        'uploaded_to_this_item' => __( 'Uploaded to this GPT', 'gpt-prompt-showcase' ),
        'items_list'            => __( 'GPTs list', 'gpt-prompt-showcase' ),
        'items_list_navigation' => __( 'GPTs list navigation', 'gpt-prompt-showcase' ),
        'filter_items_list'     => __( 'Filter GPTs list', 'gpt-prompt-showcase' ),
    );
    $args = array(
        'label'                 => __( 'Custom GPT', 'gpt-prompt-showcase' ),
        'description'           => __( 'A post type to store your custom GPTs', 'gpt-prompt-showcase' ),
        'labels'                => $labels,
        'supports'              => array( 'title', 'editor', 'thumbnail' ), // Title (Name), Editor (Description), Thumbnail (Icon)
        'hierarchical'          => false,
        'public'                => false, // We will display this via shortcode, not on its own page
        'show_ui'               => true,
        'show_in_menu'          => true,
        'menu_position'         => 5,
        'menu_icon'             => 'dashicons-superhero-alt', // ایک اچھا سا آئیکن
        'show_in_admin_bar'     => true,
        'show_in_nav_menus'     => false,
        'can_export'            => true,
        'has_archive'           => false,
        'exclude_from_search'   => true,
        'publicly_queryable'    => false, // Users shouldn't be able to query this directly
        'capability_type'       => 'post',
        'show_in_rest'          => true, // Gutenberg editor کے لیے
    );
    register_post_type( 'custom_gpts', $args );

}
add_action( 'init', 'gpts_register_cpt', 0 );


/**
 * 2. Register Taxonomy (Categories) for GPTs
 * (تاکہ آپ انہیں کیٹیگری میں تقسیم کر سکیں)
 */
function gpts_register_taxonomy() {
    $labels = array(
        'name'              => _x( 'GPT Categories', 'taxonomy general name', 'gpt-prompt-showcase' ),
        'singular_name'     => _x( 'GPT Category', 'taxonomy singular name', 'gpt-prompt-showcase' ),
        'search_items'      => __( 'Search Categories', 'gpt-prompt-showcase' ),
        'all_items'         => __( 'All Categories', 'gpt-prompt-showcase' ),
        'parent_item'       => __( 'Parent Category', 'gpt-prompt-showcase' ),
        'parent_item_colon' => __( 'Parent Category:', 'gpt-prompt-showcase' ),
        'edit_item'         => __( 'Edit Category', 'gpt-prompt-showcase' ),
        'update_item'       => __( 'Update Category', 'gpt-prompt-showcase' ),
        'add_new_item'      => __( 'Add New Category', 'gpt-prompt-showcase' ),
        'new_item_name'     => __( 'New Category Name', 'gpt-prompt-showcase' ),
        'menu_name'         => __( 'Categories', 'gpt-prompt-showcase' ),
    );
    $args = array(
        'hierarchical'      => true,
        'labels'            => $labels,
        'show_ui'           => true,
        'show_admin_column' => true,
        'query_var'         => true,
        'rewrite'           => array( 'slug' => 'gpt-category' ),
        'show_in_rest'      => true,
    );
    register_taxonomy( 'gpt_category', array( 'custom_gpts' ), $args );
}
add_action( 'init', 'gpts_register_taxonomy', 0 );


// TODO: Add Custom Fields (Meta Boxes) for GPT URL and Form Key
// TODO: Register Shortcode [gpt_showcase]

?>
