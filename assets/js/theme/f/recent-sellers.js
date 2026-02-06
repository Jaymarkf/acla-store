import graphql from './graph-ql';

export default function recentSellers(timer, hideAfter, context) {
    const recentPopup = document.querySelectorAll('.recent-sellers');
    let counter = 0;

    function hide(popup) {
        const removeAfter = hideAfter + 1;
        setTimeout(() => { recentPopup[popup].classList.add('animate__bounceOutDown'); }, hideAfter * 1000);
        setTimeout(() => { recentPopup[popup].classList.remove('animate__bounceOutDown', 'animate__bounceInUp', 'recent-sellers-visible'); }, removeAfter * 1000);
    }

    function rotate() {
        recentPopup[counter].classList.add('animate__bounceInUp', 'recent-sellers-visible');
        hide(counter);
        counter++;
        if (counter === recentPopup.length) {
            counter = 0;
        }
        setTimeout(rotate, timer * 1000);
    }

    function queryString(list) {
        const query = `query gql {
            site {
              recent_sellers: products (entityIds: [${list}]) {
                edges {
                  node {
                    entityId
                    sku
                    name
                    url: path
                    brand {
                     name
                    }
                    prices(includeTax: true) {
                     price {
                       formatted
                     }
                    }
                    image: defaultImage {
                     data: url(width: 100)
                     alt: altText
                    }
                  }
                }
              }
            }
          }`;
        return query;
    }

    graphql(context.authorization, queryString(context.recentSellersIds), (result) => {
        result.then((json) => {
          Array.from(recentPopup).slice(0, 10).forEach((e, index) => {
            const product = json.data.site.recent_sellers.edges[index];
                if (product.node.image) {
                e.getElementsByClassName('recent-sellers-image')[0].src = product.node.image.data;
                }
                e.getElementsByClassName('recent-seller-product')[0].innerHTML = product.node.name;
                e.getElementsByClassName('recent-seller-product')[0].href = product.node.url;
                e.getElementsByClassName('recent-seller-price')[0].innerHTML = product.node.prices.price.formatted;
            });
        }).then(() => {
            if (recentPopup.length) {
                rotate();
            }
        });
    });
}
