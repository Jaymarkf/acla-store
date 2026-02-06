import 'foundation-sites/js/foundation/foundation';
import 'foundation-sites/js/foundation/foundation.dropdown';
import utils from '@bigcommerce/stencil-utils';
import ProductDetails from '../common/product-details';
import { defaultModal } from './modal';
import 'slick-carousel';
import graphql from '../f/graph-ql';
import optionsGrid from '../f/options-grid';

function gqlQuery(productId) {
    const query = `query productById {
    site {
      settings {
        tax {
          pdp
        }
      }
      product(entityId: ${productId}) {
        variants(isPurchasable: true, first: 250) {
          edges {
            node {
              entityId
              sku
              defaultImage {
                ...ImageFields
              }
              inventory {
                aggregated {
                  availableToSell
                  warningLevel
                }
                isInStock
              }
              productOptions {
                edges {
                  node {
                    displayName
                    ... on MultipleChoiceOption {
                      values {
                        edges {
                          node {
                            label
                          }
                        }
                      }
                    }
                  }
                }
              }
              priceWithoutTax:prices(includeTax:false) {
                price {
                  ...MoneyFields
                }
                salePrice {
                  ...MoneyFields
                }
                retailPrice {
                  ...MoneyFields
                }
                saved {
                  ...MoneyFields
                }
                bulkPricing {
                  minimumQuantity
                  maximumQuantity
                  ... on BulkPricingFixedPriceDiscount {
                    price
                  }
                  ... on BulkPricingPercentageDiscount {
                    percentOff
                  }
                  ... on BulkPricingRelativePriceDiscount {
                    priceAdjustment
                  }
                }
              }
              priceWithTax:prices(includeTax:true) {
                price {
                  ...MoneyFields
                }
                salePrice {
                  ...MoneyFields
                }
                retailPrice {
                  ...MoneyFields
                }
                saved {
                  ...MoneyFields
                }
                bulkPricing {
                  minimumQuantity
                  maximumQuantity
                  ... on BulkPricingFixedPriceDiscount {
                    price
                  }
                  ... on BulkPricingPercentageDiscount {
                    percentOff
                  }
                  ... on BulkPricingRelativePriceDiscount {
                    priceAdjustment
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  fragment ImageFields on Image {
    imageUrl: url(width: 120)
  }
  
  fragment MoneyFields on Money {
    formatted
  }`;
    return query;
}

export default function (context) {
    const modal = defaultModal();

    $('body').on('click', '.quickview', event => {
        event.preventDefault();

        const productId = $(event.currentTarget).data('productId');
        const taxLabel = $(event.currentTarget).data('taxLabel');
        const columnLabels = $(event.currentTarget).data('gridSort');

        modal.open({ size: 'large' });

        const config = {
            template: 'products/quick-view',
        };

        utils.api.product.getById(productId, config, (err, response) => {
            modal.updateContent(response);

            modal.$content.find('.productView').addClass('productView--quickView');

            modal.$content.find('[data-slick]').slick();

            graphql(context.authorization, gqlQuery(productId), (result) => {
                result.then((json) => {
                    if (json.data.site.product.variants.edges.length) {
                        const optionsConfig = {
                            taxPriceSettings: json.data.site.settings.tax.pdp,
                            taxDisplaySettings: context.productTaxDisplaySettings,
                            taxLabel,
                            dictionary: context.gridOrderingDictionary,
                            columnLabels,
                            enable: context.gridOrderingEnabled,
                        };
                        const data = json.data.site.product.variants.edges;

                        optionsGrid(data, productId, optionsConfig);
                    }
                });
            });

            return new ProductDetails(modal.$content.find('.quickView'), context);
        });
    });
}
