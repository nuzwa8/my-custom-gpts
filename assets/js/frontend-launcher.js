// 🇵🇰 JavaScript Phase Start: Frontend Launcher 🇵🇰
(function($) {
    'use strict';

    // Rule 8: Single IIFE for scoping
    $(document).ready(function() {
        const modal = $('#ssm-gpt-modal');
        const form = $('#ssm-prompt-builder-form');
        const dynamicFieldsContainer = $('#ssm-dynamic-fields');
        const launchButton = $('#ssm-launch-button');
        const feedbackMessage = $('.ssm-feedback-message');
        
        let currentGptUrl = '';
        let currentPromptTemplate = '';

        // --- Event 1: Open Modal (Click on Card) ---
        $('.ssm-gpt-card').on('click', '[data-action="open-modal"]', function() {
            const card = $(this).closest('.ssm-gpt-card');
            
            // 1. Get Data from Card
            currentGptUrl = card.data('url');
            currentPromptTemplate = card.data('template');
            const cardTitle = card.find('.ssm-card-title').text();
            const cardDescription = card.find('.ssm-card-excerpt').text();
            
            // Rule 10: Root IDs/Selectors consistent
            const formHtml = card.find('.ssm-hidden-form-data').html();

            // 2. Populate Modal
            $('#ssm-modal-title').text(cardTitle);
            $('#ssm-modal-description').text(cardDescription);
            dynamicFieldsContainer.html(formHtml);

            // 3. Reset/Show Modal
            launchButton.find('.copied-text').hide();
            launchButton.find('.default-text').show();
            feedbackMessage.hide();
            modal.fadeIn(300);
            
            // Set focus on the first input for accessibility (Rule 9)
            dynamicFieldsContainer.find('input, select, textarea').first().focus();
        });

        // --- Event 2: Close Modal ---
        $('.ssm-close-button, #ssm-gpt-modal').on('click', function(e) {
            // Check if the click is on the close button or the backdrop, not the content
            if (e.target.id === 'ssm-gpt-modal' || $(e.target).hasClass('ssm-close-button')) {
                modal.fadeOut(300);
            }
        });

        // --- Event 3: Handle Prompt Generation (Form Submit) ---
        form.on('submit', function(e) {
            e.preventDefault(); // Stop form submission (Rule 4: Step-by-Step, Phase 5: No Interleaving)
            
            const fieldValues = {};
            let generatedPrompt = currentPromptTemplate;
            let isValid = true;

            // 1. Collect Field Values and Check Validation
            $(this).find('input, select, textarea').each(function() {
                const field = $(this);
                const fieldName = field.attr('name');
                let fieldValue = field.val();
                
                // Trim value for cleaner prompt
                fieldValue = fieldValue ? fieldValue.trim() : '';

                if (field.prop('required') && !fieldValue) {
                    isValid = false;
                    field.addClass('ssm-input-error'); // Add error class (Rule 8: Soft warnings allowed)
                    // Simple in-line warning
                    console.warn(`Validation Error: Field "${fieldName}" is required.`); 
                } else {
                    field.removeClass('ssm-input-error');
                }
                
                // Store sanitized/trimmed value
                // Rule 7: Sanitization (basic client-side, server-side is safer but JS is for UX)
                fieldValues[fieldName] = fieldValue; 
            });

            if (!isValid) {
                // Stop the process if any required field is empty
                alert('براہ کرم تمام ضروری فیلڈز پُر کریں (Please fill out all required fields).');
                return;
            }

            // 2. Replace Placeholders in the Template
            for (const key in fieldValues) {
                if (fieldValues.hasOwnProperty(key)) {
                    const placeholder = new RegExp('\\{' + key + '\\}', 'g');
                    // Replace the placeholder with the collected value
                    generatedPrompt = generatedPrompt.replace(placeholder, fieldValues[key]);
                }
            }

            // 3. Copy to Clipboard (The most important step!)
            if (navigator.clipboard) {
                navigator.clipboard.writeText(generatedPrompt).then(() => {
                    // Success Feedback
                    launchButton.find('.default-text').hide();
                    launchButton.find('.copied-text').show();
                    feedbackMessage.text('کاپی ہو گیا! براہ کرم اپنی چیٹ ونڈو میں Ctrl+V (پیسٹ) کریں۔').fadeIn(200);
                    
                    // 4. Open Custom GPT Link in New Tab
                    if (currentGptUrl) {
                        window.open(currentGptUrl, '_blank');
                    }
                    
                    // Optional: Close modal after a short delay
                    setTimeout(() => {
                        modal.fadeOut(300);
                    }, 3000);

                }).catch(err => {
                    // Failure Feedback
                    console.error('Could not copy text: ', err);
                    feedbackMessage.text('پرامپٹ کو کاپی نہیں کیا جا سکا۔ براہ کرم دستی طور پر کاپی کریں اور GPT میں پیسٹ کریں۔').fadeIn(200);
                });
            } else {
                 // Fallback for older browsers
                 console.warn("Clipboard API not available. User needs to copy manually.");
                 feedbackMessage.text('آپ کا براؤزر کلپ بورڈ کاپی کی حمایت نہیں کرتا۔ براہ کرم پرامپٹ کو دستی طور پر کاپی کریں۔').fadeIn(200);
                 
                 // Fallback: Open the link anyway
                 if (currentGptUrl) {
                     window.open(currentGptUrl, '_blank');
                 }
            }
        });
    });
})(jQuery);
// 🇵🇰 JavaScript Phase End: Frontend Launcher 🇵🇰
