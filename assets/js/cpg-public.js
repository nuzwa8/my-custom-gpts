/**
 * My Custom GPTs - Public JavaScript
 *
 * This file handles the public-facing shortcode:
 * - Reads the GPT data provided by PHP (cpgGptData)
 * - Renders the GPT cards using the <template>
 * - Manages the prompt builder form for each card
 * - Handles the "Copy Prompt" functionality
 */

// Use an IIFE (Immediately Invoked Function Expression)
( ($) => {
    'use strict';

    // ssmData (cpgPublicData) from wp_localize_script
    const ssmData = window.cpgPublicData || {};
    const strings = ssmData.strings || {};
    
    // GPT data (cpgGptData) from wp_add_inline_script
    const gpts = window.cpgGptData || [];

    // --- 1. Utility Functions ---

    /**
     * Copies text to the clipboard.
     * @param {string} text The text to copy.
     * @return {Promise} A promise that resolves on success.
     */
    async function copyToClipboard( text ) {
        if ( navigator.clipboard ) {
            // Modern async method
            return navigator.clipboard.writeText( text );
        } else {
            // Fallback for older browsers
            const $temp = $( '<textarea>' );
            $( 'body' ).append( $temp );
            $temp.val( text ).select();
            document.execCommand( 'copy' );
            $temp.remove();
            return Promise.resolve();
        }
    }

    /**
     * Escapes HTML to prevent XSS.
     * @param {string} str The string to escape.
     * @return {string} The escaped string.
     */
    function escapeHTML( str ) {
        if (!str) return '';
        return $( '<div/>' ).text( str ).html();
    }


    // --- 2. Card & Form Rendering ---

    /**
     * Renders a single GPT card.
     * @param {object} gpt The GPT data object.
     * @return {jQuery} A jQuery object for the card <div>.
     */
    function renderGptCard( gpt ) {
        const $template = $( '#cpg-card-template' );
        if ( ! $template.length ) {
            return $( '<div>Error: Template not found.</div>' );
        }

        // Clone the template
        const $card = $( $template.html() );

        // 1. Populate basic info
        $card.find( '.cpg-card-title' ).text( gpt.name );
        $card.find( '.cpg-card-description' ).text( gpt.description );
        $card.find( '.cpg-view-gpt-link' ).attr( 'href', gpt.gpt_url );

        // Store data on the card for later use
        $card.data( 'gptData', gpt );

        // 2. Build the Prompt Builder (if fields exist)
        const $promptBuilder = $card.find( '.cpg-prompt-builder' );
        const $fieldsContainer = $card.find( '.cpg-prompt-fields-container' );
        const $copyBtn = $card.find( '.cpg-copy-prompt-btn' );

        if ( gpt.prompt_fields && gpt.prompt_fields.length > 0 ) {
            
            gpt.prompt_fields.forEach( ( field, index ) => {
                const fieldId = `cpg-field-${gpt.name.replace(/\s+/g, '-')}-${index}`;
                let fieldHtml = '';

                // We use the 'label' as the key for the prompt template
                const fieldKey = field.label;

                if ( field.type === 'select' && field.options ) {
                    const options = field.options.split( ',' ).map( opt => opt.trim() );
                    
                    fieldHtml = `
                        <div class="cpg-form-group">
                            <label for="${fieldId}">${escapeHTML( field.label )}</label>
                            <select id="${fieldId}" class="cpg-prompt-input" data-key="${escapeHTML( fieldKey )}">
                                ${options.map( opt => `<option value="${escapeHTML( opt )}">${escapeHTML( opt )}</option>`).join( '' )}
                            </select>
                        </div>
                    `;
                } else {
                    // Default to 'text' type
                    fieldHtml = `
                        <div class="cpg-form-group">
                            <label for="${fieldId}">${escapeHTML( field.label )}</label>
                            <input type="text" id="${fieldId}" class="cpg-prompt-input" data-key="${escapeHTML( fieldKey )}" placeholder="${escapeHTML( field.label )}...">
                        </div>
                    `;
                }
                $fieldsContainer.append( fieldHtml );
            } );

            // Show the builder and copy button
            $promptBuilder.show();
            $copyBtn.show();

        } else {
            // No fields, hide builder and copy button
            $promptBuilder.hide();
            $copyBtn.hide();
        }

        return $card;
    }

    /**
     * Renders all GPT cards into the root container.
     */
    function renderAllCards() {
        const $root = $( '#cpg-public-root' );
        if ( ! $root.length ) {
            console.error( 'CPG Public: Root element not found.' );
            return;
        }

        // Clear loading message
        $root.empty().attr( 'data-screen', 'loaded' );

        if ( ! gpts || gpts.length === 0 ) {
            $root.html( `<p>${ __( 'No Custom GPTs have been added yet.', 'cpg' ) }</p>` );
            return;
        }

        // Create a container for the grid
        const $grid = $( '<div class="cpg-grid-container"></div>' );
        
        // Render each card and append it
        gpts.forEach( gpt => {
            $grid.append( renderGptCard( gpt ) );
        } );
        
        $root.append( $grid );
    }


    // --- 3. Event Handlers ---

    /**
     * Handles clicks on the "Copy Prompt" button (uses event delegation).
     */
    function onCopyPromptClick( e ) {
        e.preventDefault();
        const $button = $( this );
        const $card = $button.closest( '.cpg-card' );
        const gptData = $card.data( 'gptData' );

        if ( ! gptData || ! gptData.prompt_template ) {
            alert( 'Error: Prompt template not found.' );
            return;
        }

        // 1. Build the prompt
        let finalPrompt = gptData.prompt_template;

        // 2. Find all inputs/selects for this card
        $card.find( '.cpg-prompt-input' ).each( function () {
            const $input = $( this );
            const key = $input.data( 'key' );
            const value = $input.val();
            
            // Create a regex to replace {key}
            // We escape special regex characters in the key
            const escapedKey = key.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
            const regex = new RegExp( `\\{${escapedKey}\\}`, 'g' );
            
            finalPrompt = finalPrompt.replace( regex, value );
        } );

        // 3. Copy to clipboard
        copyToClipboard( finalPrompt )
            .then( () => {
                // Show success feedback
                const originalText = $button.text();
                $button.text( strings.prompt_copied || 'Copied!' ).prop( 'disabled', true );
                
                setTimeout( () => {
                    $button.text( originalText ).prop( 'disabled', false );
                }, 2000 ); // Reset after 2 seconds
            } )
            .catch( ( err ) => {
                console.error( 'CPG: Could not copy prompt.', err );
                alert( 'Error: Could not copy prompt.' );
            } );
    }


    // --- 4. Initialization ---

    /**
     * Main initialization function.
     * Runs when the DOM is ready.
     */
    function init() {
        // Find the root element
        const $root = $( '#cpg-public-root' );
        if ( ! $root.length ) {
            // Don't run if the shortcode isn't on the page
            return;
        }

        // 1. Render all the cards
        renderAllCards();

        // 2. Bind Event Handlers (using delegation)
        // We bind to the root element for dynamic content
        $root.on( 'click', '.cpg-copy-prompt-btn', onCopyPromptClick );
    }

    // Run the app
    $( document ).ready( init );

} )( jQuery );
