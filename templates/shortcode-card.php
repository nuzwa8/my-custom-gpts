<?php
// 🇵🇰 PHP Phase Start: Card Template 🇵🇰
// Variables available: $post_id, $gpt_url, $form_html, $icon_url, $prompt_template

// Data Attributes for JS:
// data-url: The GPT link
// data-template: The prompt template with placeholders
// data-form: The HTML for the form fields
?>
<div 
    class="ssm-gpt-card" 
    data-post-id="<?php echo esc_attr( $post_id ); ?>" 
    data-url="<?php echo esc_attr( $gpt_url ); ?>"
    data-template="<?php echo esc_attr( $prompt_template ); ?>"
>
    <div class="ssm-card-icon">
        <?php if ( $icon_url ) : ?>
            <img src="<?php echo esc_url( $icon_url ); ?>" alt="<?php echo esc_attr( get_the_title() ); ?> Icon" />
        <?php elseif ( has_post_thumbnail( $post_id ) ) : ?>
            <?php echo get_the_post_thumbnail( $post_id, 'thumbnail' ); ?>
        <?php else : ?>
            <span class="dashicons dashicons-lightbulb"></span>
        <?php endif; ?>
    </div>
    <h3 class="ssm-card-title"><?php the_title(); ?></h3>
    <div class="ssm-card-excerpt">
        <?php the_excerpt(); // Using excerpt for short description ?>
    </div>
    <button class="ssm-card-button" data-action="open-modal">
        <?php esc_html_e( 'Launch Builder', 'ssm-gpt-launcher' ); ?>
    </button>
    
    <div class="ssm-hidden-form-data" data-form-html>
        <?php echo $form_html; ?>
    </div>
</div>
