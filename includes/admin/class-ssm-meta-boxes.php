<?php
// 🇵🇰 PHP Phase Start: Meta Boxes Class 🇵🇰
/**
 * Adds and saves meta boxes for the Custom GPTs post type.
 */
class SSM_Meta_Boxes {

    protected $plugin_slug;

    public function __construct( $plugin_slug ) {
        $this->plugin_slug = $plugin_slug;
    }

    public function add_gpt_meta_boxes() {
        add_meta_box(
            'ssm_gpt_details',
            __( 'GPT Configuration', 'ssm-gpt-launcher' ),
            array( $this, 'render_gpt_details_meta_box' ),
            'custom_gpts',
            'normal',
            'high'
        );
    }

    public function render_gpt_details_meta_box( $post ) {
        // Security: Add nonce for security and verification
        wp_nonce_field( 'ssm_gpt_save_meta', 'ssm_gpt_meta_nonce' );

        // Get existing values
        $gpt_url          = get_post_meta( $post->ID, '_ssm_gpt_url', true );
        $prompt_template  = get_post_meta( $post->ID, '_ssm_gpt_prompt_template', true );
        $form_html        = get_post_meta( $post->ID, '_ssm_gpt_form_html', true );
        $icon_url         = get_post_meta( $post->ID, '_ssm_gpt_icon_url', true );

        ?>
        <div class="ssm-meta-box-container">
            <h3><?php esc_html_e( 'GPT Link and Icon', 'ssm-gpt-launcher' ); ?></h3>
            <table class="form-table">
                <tr>
                    <th><label for="_ssm_gpt_url"><?php esc_html_e( 'Custom GPT URL', 'ssm-gpt-launcher' ); ?></label></th>
                    <td>
                        <input type="url" id="_ssm_gpt_url" name="_ssm_gpt_url" value="<?php echo esc_url( $gpt_url ); ?>" class="regular-text" placeholder="https://chat.openai.com/g/g-xxxxxxxx-gpt-name" required />
                        <p class="description"><?php esc_html_e( 'The direct link to your Custom GPT.', 'ssm-gpt-launcher' ); ?></p>
                    </td>
                </tr>
                <tr>
                    <th><label for="_ssm_gpt_icon_url"><?php esc_html_e( 'Custom Icon URL (Optional)', 'ssm-gpt-launcher' ); ?></label></th>
                    <td>
                        <input type="url" id="_ssm_gpt_icon_url" name="_ssm_gpt_icon_url" value="<?php echo esc_url( $icon_url ); ?>" class="regular-text" placeholder="https://example.com/icon.png" />
                        <p class="description"><?php esc_html_e( 'A URL for a specific icon/image to display on the card.', 'ssm-gpt-launcher' ); ?></p>
                    </td>
                </tr>
            </table>

            <h3><?php esc_html_e( 'Prompt Generation & Form Setup', 'ssm-gpt-launcher' ); ?></h3>
            <p class="description"><?php esc_html_e( 'Use placeholders in the Prompt Template like `{grade}`, `{subject}`, which will be replaced by the Form HTML fields with the matching `name` attribute.', 'ssm-gpt-launcher' ); ?></p>

            <table class="form-table">
                <tr>
                    <th><label for="_ssm_gpt_prompt_template"><?php esc_html_e( 'Prompt Template', 'ssm-gpt-launcher' ); ?></label></th>
                    <td>
                        <textarea id="_ssm_gpt_prompt_template" name="_ssm_gpt_prompt_template" class="large-text" rows="4" style="width: 100%;" required><?php echo esc_textarea( $prompt_template ); ?></textarea>
                        <p class="description">**مثال (Example):** Create a {duration}-minute lesson plan for a {grade} level {subject} class.</p>
                    </td>
                </tr>
                <tr>
                    <th><label for="_ssm_gpt_form_html"><?php esc_html_e( 'Form HTML Fields', 'ssm-gpt-launcher' ); ?></label></th>
                    <td>
                        <textarea id="_ssm_gpt_form_html" name="_ssm_gpt_form_html" class="large-text code" rows="10" style="width: 100%;" required><?php echo esc_textarea( $form_html ); ?></textarea>
                        <p class="description">
                            <?php esc_html_e( 'Enter the HTML for your form fields (inputs, selects, etc.).', 'ssm-gpt-launcher' ); ?><br>
                            **اہم (Important):** <?php esc_html_e( 'The `name` attribute of each field MUST match the placeholder (without brackets) in the Prompt Template (e.g., `name="grade"` for `{grade}`).', 'ssm-gpt-launcher' ); ?>
                        </p>
                        <p class="description">
                            **مثال (Example):**<br>
                            <code>
                                &lt;label for="grade"&gt;Grade Level:&lt;/label&gt; &lt;input type="number" id="grade" name="grade" required&gt;&lt;br&gt;<br>
                                &lt;label for="subject"&gt;Subject:&lt;/label&gt; &lt;select id="subject" name="subject" required&gt;<br>
                                &nbsp;&nbsp;&lt;option value="Physics"&gt;Physics&lt;/option&gt;<br>
                                &nbsp;&nbsp;&lt;option value="Math"&gt;Math&lt;/option&gt;<br>
                                &lt;/select&gt;
                            </code>
                        </p>
                    </td>
                </tr>
            </table>
        </div>
        <?php
    }

    public function save_gpt_meta_data( $post_id, $post ) {
        // Rule 7: AJAX requests secure (applied to post save action here)
        // 1. Check if our nonce is set.
        if ( ! isset( $_POST['ssm_gpt_meta_nonce'] ) ) {
            return $post_id;
        }

        // 2. Verify that the nonce is valid.
        if ( ! wp_verify_nonce( $_POST['ssm_gpt_meta_nonce'], 'ssm_gpt_save_meta' ) ) {
            return $post_id;
        }

        // 3. Check the user's permissions.
        if ( ! current_user_can( 'edit_post', $post_id ) ) {
            return $post_id;
        }

        // 4. Sanitize and save the data
        if ( isset( $_POST['_ssm_gpt_url'] ) ) {
            $gpt_url = esc_url_raw( wp_unslash( $_POST['_ssm_gpt_url'] ) ); // Sanitize as URL
            update_post_meta( $post_id, '_ssm_gpt_url', $gpt_url );
        }
        
        if ( isset( $_POST['_ssm_gpt_icon_url'] ) ) {
            $icon_url = esc_url_raw( wp_unslash( $_POST['_ssm_gpt_icon_url'] ) ); // Sanitize as URL
            update_post_meta( $post_id, '_ssm_gpt_icon_url', $icon_url );
        }

        if ( isset( $_POST['_ssm_gpt_prompt_template'] ) ) {
            // Sanitize as text, allowing placeholders
            $prompt_template = sanitize_textarea_field( wp_unslash( $_POST['_ssm_gpt_prompt_template'] ) ); 
            update_post_meta( $post_id, '_ssm_gpt_prompt_template', $prompt_template );
        }

        if ( isset( $_POST['_ssm_gpt_form_html'] ) ) {
            // Sanitize form HTML: use wp_kses_post for simple fields, but be aware of security risks of allowing arbitrary HTML
            // For production, a dedicated field builder and stricter sanitization is recommended.
            $form_html = wp_kses( wp_unslash( $_POST['_ssm_gpt_form_html'] ), 'post' ); 
            update_post_meta( $post_id, '_ssm_gpt_form_html', $form_html );
        }
    }
}
// 🇵🇰 PHP Phase End: Meta Boxes Class 🇵🇰
