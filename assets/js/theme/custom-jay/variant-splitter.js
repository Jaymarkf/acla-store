// let allProducts = [];

// export function variantSplitter(context, auth) {
//     getVariants(context, auth).then(products => {
//         allProducts = products; // store globally
//         renderProducts(products, 'products-container');
//     });
// }

// // Render all products
// export function renderProducts(products) {
//     const container = document.getElementById('product-listing-container');
//     container.innerHTML = ''; // clear container

//     products.forEach(product => {
//         const productCard = document.createElement('div');
//         productCard.className = 'product-card';
//         productCard.style.cursor = 'pointer';
//         productCard.style.border = '1px solid #ccc';
//         productCard.style.padding = '10px';
//         productCard.style.margin = '10px';
//         productCard.style.display = 'inline-block';
//         productCard.style.width = '200px';
//         productCard.style.textAlign = 'center';

//         // Product image
//         const img = document.createElement('img');
//         img.src = product.defaultImage?.url || '';
//         img.alt = product.name;
//         img.style.width = '100%';
//         productCard.appendChild(img);

//         // Product name
//         const nameEl = document.createElement('h3');
//         nameEl.textContent = product.name;
//         productCard.appendChild(nameEl);

//         // Store variants
//         productCard.dataset.variants = JSON.stringify(product.variants.edges);

//         // Click to show variants
//         productCard.addEventListener('click', () => {
//             renderVariants(product.variants.edges);
//         });

//         container.appendChild(productCard);
//     });
// }

// // Render variants
// export function renderVariants(variantEdges) {
//     const container = document.getElementById('product-listing-container');
//     container.innerHTML = ''; // clear container

//     variantEdges.forEach(variantEdge => {
//         const variant = variantEdge.node;

//         const variantCard = document.createElement('div');
//         variantCard.className = 'variant-card';
//         variantCard.style.border = '1px solid #ccc';
//         variantCard.style.padding = '10px';
//         variantCard.style.margin = '10px';
//         variantCard.style.display = 'inline-block';
//         variantCard.style.width = '200px';
//         variantCard.style.textAlign = 'center';

//         // Variant image
//         const img = document.createElement('img');
//         img.src = variant.defaultImage?.url || '';
//         img.alt = variant.sku || '';
//         img.style.width = '100%';
//         variantCard.appendChild(img);

//         // SKU or name
//         const nameEl = document.createElement('h4');
//         nameEl.textContent = variant.sku || 'No SKU';
//         variantCard.appendChild(nameEl);

//         // Price
//         const priceEl = document.createElement('p');
//         const price = variant.prices?.price?.value || '0';
//         const currency = variant.prices?.price?.currencyCode || 'USD';
//         priceEl.textContent = `${currency} ${price}`;
//         variantCard.appendChild(priceEl);

//         // Placeholder add button
//         const btn = document.createElement('button');
//         btn.textContent = 'Add';
//         variantCard.appendChild(btn);

//         container.appendChild(variantCard);
//     });

//     // Back button
//     const backBtn = document.createElement('button');
//     backBtn.textContent = 'Back to Products';
//     backBtn.style.display = 'block';
//     backBtn.style.margin = '20px auto';
//     backBtn.addEventListener('click', () => {
//         renderProducts(allProducts);
//     });
//     container.appendChild(backBtn);
// }

// export async function getVariants(productIds, auth) {
//     productIds = productIds.map(p => p.id);

//     const query = `
//         query getVariants($productIds: [Int!]!) {
//             site {
//                 products(entityIds: $productIds) {
//                     edges {
//                         node {
//                             name
//                             defaultImage {
//                                 url(width: 300)
//                             }
//                             variants(first: 250) {
//                                 edges {
//                                     node {
//                                         sku
//                                         prices {
//                                             price { ...PriceFields }
//                                             salePrice { ...PriceFields }
//                                             basePrice { ...PriceFields }
//                                             retailPrice { ...PriceFields }
//                                         }
//                                         defaultImage {
//                                             url(width: 300)
//                                         }
//                                         productOptions {
//                                             edges {
//                                                 node {
//                                                     ... on MultipleChoiceOption {
//                                                         values {
//                                                             edges {
//                                                                 node {
//                                                                     label
//                                                                 }
//                                                             }
//                                                         }
//                                                     }
//                                                 }
//                                             }
//                                         }
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 }
//             }
//         }

//         fragment PriceFields on Money {
//             value
//             currencyCode
//         }
//     `;

//     try {
//         const res = await fetch('/graphql', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 Authorization: `Bearer ${auth}`,
//             },
//             body: JSON.stringify({
//                 query,
//                 variables: { productIds },
//             }),
//         });

//         const json = await res.json();

//         if (json.errors) {
//             console.error('GraphQL Errors:', json.errors);
//             return null;
//         }

//         const products = json?.data?.site?.products?.edges.map(edge => edge.node);
//         console.log(products);

//         return products;

//     } catch (error) {
//         console.error('Fetch error:', error);
//         return null;
//     }
// }
