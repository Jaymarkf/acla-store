// Function to sort and define option labels
function getSortedOptionLabels(variants, topAxisPreference = '') {
    const firstVariantOptions = [...variants[0].node.productOptions.edges]; // Copy array to avoid modifying the original

    // Sort options based on the provided preference or default to alphabetical
    const sortedOptions = firstVariantOptions.sort((a, b) => {
        const nameA = a.node.displayName.toUpperCase();
        const nameB = b.node.displayName.toUpperCase();
        const preference = topAxisPreference.toUpperCase();

        // If a preference is provided, prioritize it
        if (nameA === preference) return 1;
        if (nameB === preference) return -1;

        // Fallback to alphabetical sorting
        // eslint-disable-next-line no-nested-ternary
        return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
    });

    // Assign labels after sorting
    const option1Label = sortedOptions[0].node.displayName;
    const option2Label = sortedOptions[1].node.displayName;

    return { option1Label, option2Label };
}

// Function to determine stock indicator class
function getStockClass(maxQty, warningLevel) {
    if (maxQty <= 0) return 'card-stock--outStock';
    if (maxQty <= warningLevel) return 'card-stock--lowStock';
    return 'card-stock--inStock';
}

// Function to check if an active cart exists
function checkActiveCart() {
    const route = '/api/storefront/carts';
    return fetch(route, {
        method: 'GET',
        credentials: 'same-origin',
    })
        .then(response => response.json())
        .then(result => {
            if (result.length > 0) {
                return result[0]; // Return the active cart ID if exists
            }
        })
        .catch(error => {
            console.error('Error checking cart:', error);
            return null;
        });
}

function extractNumberFromPrice(price) {
    const numericString = price.replace(/[^0-9.,-]+/g, '');

    if (numericString.includes(',')) {
        if (numericString.indexOf(',') < numericString.indexOf('.')) {
            return parseFloat(numericString.replace(/,/g, ''));
        }

        return parseFloat(numericString.replace(/\./g, '').replace(',', '.'));
    }
    return parseFloat(numericString);
}

function calculateFormattedTotalWithTemplate(priceTemplate, quantity) {
    const price = extractNumberFromPrice(priceTemplate);
    const total = price * quantity;

    // Replace the original number with the new total, keeping the surrounding text intact
    return priceTemplate.replace(/[0-9.,-]+/, total.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }));
}

function updateRunningTotals(lang) {
    const combinedTotals = [];

    // Iterate over all product totals
    document.querySelectorAll('[data-grid-product-total]').forEach(totalElement => {
        totalElement.innerHTML.split('<br>').forEach(line => {
            // Extract the numeric part and surrounding text
            const match = line.match(/(.*?)([0-9.,-]+)(.*)/);
            if (match) {
                const [_, prefix, numericPart, suffix] = match;
                const value = parseFloat(numericPart.replace(/,/g, '')); // Convert numeric part to a float
                if (!isNaN(value)) {
                    combinedTotals.push({
                        prefix: prefix.trim(),
                        suffix: suffix.trim(),
                        value,
                    });
                }
            }
        });
    });

    // Aggregate totals by format (prefix and suffix)
    const aggregatedTotals = combinedTotals.reduce((acc, { prefix, suffix, value }) => {
        const key = `${prefix}|${suffix}`; // Use prefix and suffix as the unique key
        if (!acc[key]) {
            acc[key] = { prefix, suffix, total: 0 };
        }
        acc[key].total += value;
        return acc;
    }, {});

    const totalItems = Array.from(document.querySelectorAll('input[data-grid-quantity]'))
        .reduce((sum, input) => {
            const quantity = parseInt(input.value, 10) || 0;
            return sum + quantity;
        }, 0);

    // Update the running totals display
    const runningTotalElement = document.querySelector('[data-grid-running-total]');
    if (Object.keys(aggregatedTotals).length > 0) {
        const totalHTML = Object.values(aggregatedTotals)
            .map(({ prefix, suffix, total }) => {
                return `${prefix}${total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })} ${suffix}`;
            })
            .join('<br>');

        runningTotalElement.innerHTML = `<span>${totalItems} ${totalItems > 1 ? lang.items : lang.item}:</span><br>${totalHTML}`;
    } else {
        // Clear the running total entirely if no values are present
        runningTotalElement.innerHTML = '';
    }
}

function updateTotals(input, lang) {
    const quantity = parseInt(input.value, 10) || 0;
    const productElement = input.closest('.options-grid--card');

    // Price elements
    const incTaxPriceElement = productElement.querySelector('.options-grid--price.price-with-tax');
    const exTaxPriceElement = productElement.querySelector('.options-grid--price.price-without-tax');
    const productTotalElement = productElement.querySelector('[data-grid-product-total]');

    // If quantity is 0, clear the total and exit
    if (quantity === 0) {
        productTotalElement.innerHTML = '';
        updateRunningTotals(lang); // Ensure the running totals are also updated
        return;
    }

    // Get original price templates
    const incTaxTemplate = incTaxPriceElement ? incTaxPriceElement.textContent : null;
    const exTaxTemplate = exTaxPriceElement ? exTaxPriceElement.textContent : null;

    // Calculate totals
    const incTaxTotal = incTaxTemplate ? calculateFormattedTotalWithTemplate(incTaxTemplate, quantity) : null;
    const exTaxTotal = exTaxTemplate ? calculateFormattedTotalWithTemplate(exTaxTemplate, quantity) : null;

    // Update product total display
    let productTotalHTML = `<span>${lang.total}:</span>`;
    if (exTaxTotal) productTotalHTML += `<br>${exTaxTotal}`;
    if (incTaxTotal) productTotalHTML += `<br>${incTaxTotal}`;

    productTotalElement.innerHTML = productTotalHTML;

    // Update running totals
    updateRunningTotals(lang);
}

function compileTemplate(template) {
    // Pre-compile by returning a function for substitution
    return (values) => {
        return template.replace(/{(\w+)}/g, (_, key) => {
            return values[key] !== undefined && values[key] !== null ? values[key] : '';
        });
    };
}

function handleInputFeedback(input, stockLevel, quantityInCart, currentInputValue, isInCart, templates) {
    const totalRequested = currentInputValue + quantityInCart;
    const feedbackElement = input.closest('.options-grid--card').querySelector('[data-cart-feedback]');
    const remainingStock = Math.max(stockLevel - quantityInCart, 0);

    // Mapping of conditions to feedback logic
    const conditionMap = {
        exceedsStock: {
            condition: () => totalRequested > stockLevel,
            action: () => ({
                feedback: `
                    ${templates.notEnoughStock({})}<br>
                    ${quantityInCart ? `${templates.quantityInCartAndStock({ quantity: quantityInCart, stock: stockLevel })}<br>` : ''}
                    ${templates.quantityAdjusted({ quantity: remainingStock })}
                `,
                className: 'options-grid--feedback feedback--error',
                adjustInput: remainingStock,
            }),
        },
        inCart: {
            condition: () => isInCart && currentInputValue > 0,
            action: () => ({
                feedback: templates.addingMore({ quantity: quantityInCart, adding: currentInputValue }),
                className: 'options-grid--feedback feedback--success',
            }),
        },
        inCartNoAdditional: {
            condition: () => isInCart && currentInputValue === 0,
            action: () => ({
                feedback: templates.quantityInCart({ quantity: quantityInCart }),
                className: 'options-grid--feedback',
            }),
        },
        newValidItem: {
            condition: () => !isInCart && currentInputValue > 0,
            action: () => ({
                feedback: templates.quantityWillBeAdded({ quantity: currentInputValue }),
                className: 'options-grid--feedback feedback--success',
            }),
        },
        default: {
            condition: () => true,
            action: () => ({
                feedback: '',
                className: 'options-grid--feedback',
            }),
        },
    };

    // Find and execute the matching condition
    const { feedback, className, adjustInput } = Object.values(conditionMap)
        .find(({ condition }) => condition())
        .action();

    // Adjust the input value if necessary
    if (adjustInput !== undefined) input.value = adjustInput;

    // Update the feedback element
    feedbackElement.innerHTML = feedback;
    feedbackElement.className = className;
}

// Function to handle cart creation or item addition
function handleAddToCart(productId, addToCartButton, lang, compiledTemplates) {
    let cartId;

    const cartItems = {
        lineItems: [],
    };

    let totalQuantityAdded = 0;

    // Select the cart quantity element
    const cartQuantityElement = document.querySelector('.countPill.countPill--positive.cart-quantity');

    // Extract the text content and convert it to an integer
    const currentCartQuantity = parseInt(cartQuantityElement.textContent, 10);

    // Gather selected quantities
    document.querySelectorAll('input[data-grid-quantity]').forEach(input => {
        const quantity = parseInt(input.value, 10);
        if (quantity > 0) {
            const variantId = input.getAttribute('data-variant-id');
            cartItems.lineItems.push({
                quantity,
                productId,
                variantId: parseInt(variantId, 10),
            });
            totalQuantityAdded += quantity;
        }
    });

    if (cartItems.lineItems.length === 0) {
        alert(lang.make_selection_first);
        return;
    }

    // Provide feedback
    addToCartButton.textContent = lang.adding_items;

    checkActiveCart().then(activeCart => {
        if (activeCart) {
            cartId = activeCart.id; // Use the existing cart
        } else {
            cartId = null; // No active cart; will trigger cart creation
        }

        // Perform the cart action
        const routeStart = '/api/storefront/carts/';
        const route = cartId ? `${routeStart}${cartId}/items` : routeStart;

        // Call API function
        fetch(route, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cartItems),
        })
            .then(response => response.json())
            .then(result => {
                if (!cartId && result.id) {
                    cartId = result.id;
                }

                if (result.lineItems && result.lineItems.physicalItems) {
                    result.lineItems.physicalItems.forEach(item => {
                        const quantity = item.quantity;
                        const variantId = item.variantId;
                        const input = document.querySelector(`[data-variant-id="${variantId}"]`);
                        const feedbackElement = input.closest('.options-grid--card').querySelector('[data-cart-feedback]');
                        const totalElement = input.closest('.options-grid--card').querySelector('[data-grid-product-total]');
                        const runningTotalElement = document.querySelector('[data-grid-running-total]');

                        // Update the message to show items have been added
                        feedbackElement.textContent = compiledTemplates.quantityInCart({ quantity });
                        feedbackElement.className = 'options-grid--feedback';

                        // Reset the quantity input to '0'
                        input.value = '0';

                        totalElement.innerHTML = '';
                        runningTotalElement.innerHTML = '';
                    });
                }

                if (result.status === 422) {
                    checkActiveCart()
                        .then(res => {
                            const cartVariantIds = new Set();

                            // Track variant IDs already in the cart
                            if (res.lineItems && res.lineItems.physicalItems) {
                                res.lineItems.physicalItems.forEach(item => cartVariantIds.add(item.variantId));
                            }

                            // Iterate over inputs and handle feedback
                            document.querySelectorAll('[data-grid-quantity]').forEach(input => {
                                const variantId = parseInt(input.getAttribute('data-variant-id'), 10);
                                const currentInputValue = parseInt(input.value, 10) || 0;
                                const stockDiv = input.closest('.options-grid--card').querySelector('[data-stock-level]');
                                const stockLevel = parseInt(stockDiv.getAttribute('data-stock-level'), 10) || 0;
                                const cartItem = res.lineItems?.physicalItems?.find(item => item.variantId === variantId);
                                const quantityInCart = cartItem ? cartItem.quantity : 0;

                                handleInputFeedback(input, stockLevel, quantityInCart, currentInputValue, cartVariantIds.has(variantId), compiledTemplates);
                                updateTotals(input, lang);
                            });
                        })
                        .then(() => {
                            alert(`${result.title} \n${lang.low_stock_alert_1} \n${lang.low_stock_alert_2}`);
                        });
                }

                const itemsUpdate = currentCartQuantity + totalQuantityAdded;
                $('body').trigger('cart-quantity-update', itemsUpdate);

                addToCartButton.textContent = lang.add_selected;
            })
            .catch(() => {
                addToCartButton.textContent = lang.add_selected;
            });
    });
}

export default function (data, productId, config) {
    const {
        taxPriceSettings, taxDisplaySettings, taxLabel, dictionary, columnLabels = '', enable = false,
    } = config;

    if (!enable) {
        return;
    }

    if (!data.length) {
        return;
    }

    const { translations } = JSON.parse(dictionary);

    const lang = Object.fromEntries(Object.entries(translations).map(([key, value]) => [
        key.replace('b2b.grid_ordering.', ''), // Remove the prefix
        value,
    ]));

    const compiledTemplates = {
        notEnoughStock: compileTemplate(lang.not_enough_stock),
        quantityInCartAndStock: compileTemplate(lang.quantity_in_cart_and_stock),
        quantityAdjusted: compileTemplate(lang.quantity_adjusted),
        addingMore: compileTemplate(lang.adding_more),
        quantityInCart: compileTemplate(lang.quantity_in_cart),
        quantityWillBeAdded: compileTemplate(lang.quantity_will_be_added),
    };

    const variants = data;

    const optionsGrid = document.getElementById('optionsGrid');

    const optionsContainer = document.querySelector('.has-options-grid');

    const { option1Label, option2Label } = getSortedOptionLabels(variants, columnLabels);

    // Extract unique values for each option
    const option1Values = Array.from(new Set(variants.map(variant => {
        const option = variant.node.productOptions.edges.find(opt => opt.node.displayName === option1Label);
        return option ? option.node.values.edges[0].node.label : null;
    }))).filter(Boolean);

    const option2Values = Array.from(new Set(variants.map(variant => {
        const option = variant.node.productOptions.edges.find(opt => opt.node.displayName === option2Label);
        return option ? option.node.values.edges[0].node.label : null;
    }))).filter(Boolean);

    // Create a lookup table for easy access to variants
    const lookupTable = {};
    variants.forEach(variant => {
        const option1Value = variant.node.productOptions.edges.find(opt => opt.node.displayName === option1Label).node.values.edges[0].node.label;
        const option2Value = variant.node.productOptions.edges.find(opt => opt.node.displayName === option2Label).node.values.edges[0].node.label;

        if (!lookupTable[option1Value]) lookupTable[option1Value] = {};
        lookupTable[option1Value][option2Value] = variant.node; // Store the variant node for easy lookup
    });

    // Render the grid container
    const gridContainer = document.createElement('div');
    gridContainer.className = 'options-grid';
    gridContainer.id = 'productOptionsGrid';

    // Set the grid template columns dynamically
    const columnWidth = `repeat(${option2Values.length}, 1fr)`; // Equal widths for the option2 columns
    
    // Create the header row
    const headerRow = document.createElement('div');
    headerRow.className = 'options-grid--header-row';
    
    // Create the first header cell for Option1 / Option2 label
    const headerLabel = document.createElement('div');
    headerLabel.className = 'options-grid--header-cell';
    headerLabel.textContent = `${option1Label} / ${option2Label}`;
    gridContainer.style.gridTemplateColumns = `${headerLabel.textContent.length < 15 ? '10%' : '20%'} ${columnWidth}`;
    headerRow.appendChild(headerLabel);

    // Create header cells for each option2Value
    option2Values.forEach(value => {
        const headerCell = document.createElement('div');
        headerCell.className = 'options-grid--header-cell';
        headerCell.textContent = value;
        headerRow.appendChild(headerCell);
    });
    gridContainer.appendChild(headerRow);

    // Create rows for each Option1 value
    option1Values.forEach(option1Value => {
        const row = document.createElement('div');
        row.className = 'options-grid--row';

        // Create the first cell for the Option1 value
        const rowHeader = document.createElement('div');
        rowHeader.className = 'options-grid--row-header';
        rowHeader.textContent = option1Value;
        rowHeader.setAttribute('data-header-label', `${option1Label}: `);
        row.appendChild(rowHeader);

        // Create cells for each Option2 value
        option2Values.forEach(option2Value => {
            const cell = document.createElement('div');
            const variant = lookupTable[option1Value][option2Value];

            if (variant) {
                let stockMessage = lang.stock_unavailable;
                let stockClass = 'card-stock--outStock';
                let maxQty = 0;

                if (variant.inventory && variant.inventory.aggregated) {
                    maxQty = variant.inventory.aggregated.availableToSell;
                    const warningLevel = variant.inventory.aggregated.warningLevel || 0;

                    stockMessage = maxQty > 0 ? `${maxQty} ${lang.in_stock}` : lang.out_of_stock;

                    stockClass = getStockClass(maxQty, warningLevel);
                }

                cell.innerHTML = `
                    <img src="${variant.defaultImage && variant.defaultImage.imageUrl ? variant.defaultImage.imageUrl : '/path/to/fallback-image.png'}" alt="${variant.sku}" loading="lazy" class="options-grid--image">
                    <div class="options-grid--mobile-option-label" data-grid-header-label="${option1Value} / ${option2Value}"></div>
                    ${variant.sku ? `<div class="options-grid--sku">${variant.sku}</div>` : ''}
                    ${variant.priceWithTax && (taxPriceSettings === 'INC' || taxPriceSettings === 'BOTH') ? `
                        <div class="options-grid--price price-with-tax">
                            ${variant.priceWithTax.price.formatted}${taxDisplaySettings ? ` ${lang.tax_inc} ${taxLabel}` : ''}
                        </div>` : ''}
                    ${variant.priceWithoutTax && (taxPriceSettings === 'EX' || taxPriceSettings === 'BOTH') ? `
                        <div class="options-grid--price price-without-tax">
                            ${variant.priceWithoutTax.price.formatted}${taxDisplaySettings ? ` ${lang.tax_ex} ${taxLabel}` : ''}
                        </div>` : ''}
                    <div class="options-grid--stock ${stockClass}" data-stock-level="${maxQty}">${stockMessage}${stockClass === 'card-stock--lowStock' ? `<span class="options-grid--low-stock-indicator">${lang.low_stock}</span>` : ''}</div>
                    <div class="options-grid--quantity-container">
                        <input data-grid-quantity type="number" name="quantity_${variant.entityId}" value="0" min="0" max="${maxQty}" data-variant-id="${variant.entityId}" data-product-id="${productId}" ${variant.inventory && variant.inventory.aggregated && variant.inventory.aggregated.availableToSell === 0 ? 'disabled' : ''} class="form-input form-input--incrementTotal" autocomplete="off">
                        <div class="options-grid--product-total" data-grid-product-total></div>
                    </div>
                    <div data-cart-feedback></div>
                `;
            } else {
                cell.textContent = lang.not_available;
            }

            cell.className = 'options-grid--card';
            row.appendChild(cell);
        });

        gridContainer.appendChild(row);
    });

    // Add the grid to the DOM
    optionsGrid.appendChild(gridContainer);


    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'options-grid--controls';

    // Add running total container
    const runningTotal = document.createElement('div');
    runningTotal.setAttribute('data-grid-running-total', '');
    runningTotal.className = 'options-grid--running-total';
    controlsContainer.appendChild(runningTotal);

    // Add mass "Add to Cart" button and handler
    const addToCartButton = document.createElement('button');
    addToCartButton.classList.add('button', 'button--primary', 'options-grid--button');
    addToCartButton.textContent = lang.add_selected;
    addToCartButton.addEventListener('click', () => handleAddToCart(productId, addToCartButton, lang, compiledTemplates));
    controlsContainer.appendChild(addToCartButton);

    // Add Reset button to the controls container
    const resetButton = document.createElement('button');
    resetButton.classList.add('button', 'button--secondary', 'options-grid--button');
    resetButton.textContent = lang.reset;
    resetButton.addEventListener('click', () => {
        // Set all input[data-grid-quantity] to 0
        document.querySelectorAll('input[data-grid-quantity]').forEach(input => {
            input.value = 0;
        });

        // Clear content from all [data-grid-product-total] elements
        document.querySelectorAll('[data-grid-product-total]').forEach(totalElement => {
            totalElement.innerHTML = '';
        });

        // Clear content from [data-grid-running-total]
        const runningTotalElement = document.querySelector('[data-grid-running-total]');
        if (runningTotalElement) {
            runningTotalElement.innerHTML = '';
        }
    });
    controlsContainer.appendChild(resetButton);

    optionsGrid.appendChild(controlsContainer);
    optionsContainer.classList.add('show');

    // Select all number inputs within the options grid
    const numberInputs = document.querySelectorAll('#optionsGrid input[type="number"]');

    // Attach an input event listener to each input to enforce the max value
    numberInputs.forEach(input => {
        input.addEventListener('input', () => {
            const max = parseInt(input.getAttribute('max'), 10); // Get the max value from the attribute
            const stockDiv = input.closest('.options-grid--card').querySelector('[data-stock-level]'); // Find the closest stock div

            if (input.value > max) { // If input exceeds max
                input.value = max; // Reset to max
                stockDiv.classList.add('card-stock--warning'); // Add highlight class
                input.classList.add('input-stock--warning');
            } else {
                stockDiv.classList.remove('card-stock--warning'); // Remove highlight class if below max
                input.classList.remove('input-stock--warning');
            }

            updateTotals(input, lang);
        });

        // Add event listener for focus events
        input.addEventListener('focus', () => {
            input.select(); // Select the text in the input
        });
    });
}
