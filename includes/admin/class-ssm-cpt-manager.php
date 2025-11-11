<?php
// 🇵🇰 PHP Phase Start: CPT Manager Class 🇵🇰
/**
 * Registers the Custom Post Type (custom_gpts) and Taxonomy (gpt_category).
 */
class SSM_CPT_Manager {

    public static function register_cpt() {
        $labels = array(
            'name'                  => _x( 'Custom GPTs', 'Post Type General Name', 'ssm-gpt-launcher' ),
            'singular_name'         => _x( 'Custom GPT', 'Post Type Singular Name', 'ssm-gpt-launcher' ),
            'menu_name'             => __( 'GPT Manager', 'ssm-gpt-launcher' ),
            'name_admin_bar'        => __( 'Custom GPT', 'ssm-gpt-launcher' ),
            'archives'              => __( 'GPT Archives', 'ssm-gpt-launcher' ),
            'attributes'            => __( 'GPT Attributes', 'ssm-gpt-launcher' ),
            'parent_item_colon'     => __( 'Parent GPT:', 'ssm-gpt-launcher' ),
            'all_items'             => __( 'All GPTs', 'ssm-gpt-launcher' ),
            'add_new_item'          => __( 'Add New GPT', 'ssm-gpt-launcher' ),
            'add_new'               => __( 'Add New', 'ssm-gpt-launcher' ),
            'new_item'              => __( 'New GPT', 'ssm-gpt-launcher' ),
            'edit_item'             => __( 'Edit GPT', 'ssm-gpt-launcher' ),
            'update_item'           => __( 'Update GPT', 'ssm-gpt-launcher' ),
            'view_item'             => __( 'View GPT', 'ssm-gpt-launcher' ),
            'view_items'            => __( 'View GPTs', 'ssm-gpt-launcher' ),
            'search_items'          => __( 'Search GPT', 'ssm-gpt-launcher' ),
            'not_found'             => __( 'Not found', 'ssm-gpt-launcher' ),
            'not_found_in_trash'    => __( 'Not found in Trash', 'ssm-gpt-launcher' ),
            'featured_image'        => __( 'GPT Icon/Image', 'ssm-gpt-launcher' ),
            'set_featured_image'    => __( 'Set GPT Icon/Image', 'ssm-gpt-launcher' ),
            'remove_featured_image' => __( 'Remove GPT Icon/Image', 'ssm-gpt-launcher' ),
            'use_featured_image'    => __( 'Use as GPT Icon/Image', 'ssm-gpt-launcher' ),
            'insert_into_item'      => __( 'Insert into GPT', 'ssm-gpt-launcher' ),
            'uploaded_to_this_item' => __( 'Uploaded to this GPT', 'ssm-gpt-launcher' ),
            'items_list'            => __( 'GPTs list', 'ssm-gpt-launcher' ),
            'items_list_navigation' => __( 'GPTs list navigation', 'ssm-gpt-launcher' ),
            'filter_items_list'     => __( 'Filter GPTs list', 'ssm-gpt-launcher' ),
        );
        $args = array(
            'label'                 => __( 'Custom GPT', 'ssm-gpt-launcher' ),
            'description'           => __( 'Custom GPT definitions and configurations.', 'ssm-gpt-launcher' ),
            'labels'                => $labels,
            'supports'              => array( 'title', 'editor', 'thumbnail' ), // Use standard editor for description
            'hierarchical'          => false,
            'public'                => true,
            'show_ui'               => true,
            'show_in_menu'          => true, // Will show under the main menu
            'menu_position'         => 5,
            'show_in_admin_bar'     => true,
            'show_in_nav_menus'     => true,
            'can_export'            => true,
            'has_archive'           => false,
            'exclude_from_search'   => true,
            'publicly_queryable'    => true,
            'capability_type'       => 'post',
            'show_in_rest'          => true,
            'menu_icon'             => 'dashicons-lightbulb',
        );
        register_post_type( 'custom_gpts', $args );
    }
    
    public static function register_taxonomy() {
        $labels = array(
            'name'                       => _x( 'GPT Categories', 'Taxonomy General Name', 'ssm-gpt-launcher' ),
            'singular_name'              => _x( 'GPT Category', 'Taxonomy Singular Name', 'ssm-gpt-launcher' ),
            'menu_name'                  => __( 'Categories', 'ssm-gpt-launcher' ),
            'all_items'                  => __( 'All Categories', 'ssm-gpt-launcher' ),
            'parent_item'                => __( 'Parent Category', 'ssm-gpt-launcher' ),
            'parent_item_colon'          => __( 'Parent Category:', 'ssm-gpt-launcher' ),
            'new_item_name'              => __( 'New Category Name', 'ssm-gpt-launcher' ),
            'add_new_item'               => __( 'Add New Category', 'ssm-gpt-launcher' ),
            'edit_item'                  => __( 'Edit Category', 'ssm-gpt-launcher' ),
            'update_item'                => __( 'Update Category', 'ssm-gpt-launcher' ),
            'view_item'                  => __( 'View Category', 'ssm-gpt-launcher' ),
            'separate_items_with_commas' => __( 'Separate categories with commas', 'ssm-gpt-launcher' ),
            'add_or_remove_items'        => __( 'Add or remove categories', 'ssm-gpt-launcher' ),
            'choose_from_most_used'      => __( 'Choose from the most used', 'ssm-gpt-launcher' ),
            'popular_items'              => __( 'Popular Categories', 'ssm-gpt-launcher' ),
            'search_items'               => __( 'Search Categories', 'ssm-gpt-launcher' ),
            'not_found'                  => __( 'Not Found', 'ssm-gpt-launcher' ),
            'no_terms'                   => __( 'No categories', 'ssm-gpt-launcher' ),
            'items_list'                 => __( 'Categories list', 'ssm-gpt-launcher' ),
            'items_list_navigation'      => __( 'Categories list navigation', 'ssm-gpt-launcher' ),
        );
        $args = array(
            'labels'                     => $labels,
            'hierarchical'               => true, // Categories can have parents
            'public'                     => true,
            'show_ui'                    => true,
            'show_admin_column'          => true,
            'show_in_nav_menus'          => true,
            'show_tagcloud'              => false,
            'show_in_rest'               => true,
        );
        register_taxonomy( 'gpt_category', array( 'custom_gpts' ), $args );
    }
}
// 🇵🇰 PHP Phase End: CPT Manager Class 🇵🇰
