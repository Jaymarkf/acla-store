# Changelog

## 1.13.1 (2025-03-24)

### Updated

- Added nonce to scripts in checkout and account pages

### Removed

- The cookie component as it wasn't being used
- The GeoTrust component as it wasn't being used

## 1.13.0 (2024-12-18)

### Added

- A new option to display a product option grid, ideal for B2B stores with products that have 2 sets of vaiants, i.e. color and size.

### Updated

- Page builder theme information bar

## 1.12.2 (2024-08-14)

### Added

- A new option lets you turn off capitalization for headings and titles when they need to be case-sensitive

## 1.12.1 (2024-08-14)

### Fixed

- The sub-category grid on the category pages wasn't displaying properly


## 1.12.0 (2024-08-06)

### Added

- Theme info bar in the page builder
- Wallet button support on product pages
- There is a new global setting to change the capitalization of headings and titles
- New global settings now allow you to adjust the roundness of buttons and inputs


### Updated

- Moved phrases and static text to en.json to improve translation customization
- Improvements have been made to make sure the header scales correctly on mobile devices
- Improvements have been made to the sub-category grid design on the category pages
- The cookie message design has been updated to better match the theme
- There were previously inconsistencies with the dropdown arrows in the header
- The social media icons have been updated

### Fixed

- The search bar was previously misaligned, floating to the right
- The text logo was overflowing off the side of the page on mobile devices, especially with longer text
- The list view for product cards was overflowing on mobile devices
- Changing the number of products per page on category pages after applying filters would reset the page
- Display bug in the recently purchased products conversion booster
- The sub-category images on the category pages were sometimes blurry, depending on other settings
- The store logo occasionally appeared blurry
- The "Buy Now" button on the product pages remained active, even when the selected product variation was out of stock
- The product weight didn't change to match the weight of the product variation
- When the product pricing was restricted, the product variations were also hidden on the product pages
- The home page hero banners did not display correctly when the Body text font size was set to certain values
- If product comparisons were disabled, the sorting label got cut off on category pages

## 1.11.5 (2023-12-06)

### Updated

- There was too much whitespace between the pricing information on the product pages
- Improved the responsiveness of the video area on product pages

### Fixed

- Empty product label display issue
- Not all pricing information was displaying on the right column of product pages

## 1.11.4 (2023-08-31)

### Added

- Option to pick the product price location on the product pages
- Global page builder regions on the product pages

### Updated

- Buy section column width on the product pages

### Fixed

- The Styles section of the theme editor was missing the footer heading
- Product UPC wasn't always showing on the product pages
- The stock wasn't showing for variant levels on the product pages

## 1.11.3 (2023-07-18)

### Fixed

- Page Builder UI issues
- Display issues in the header when logo is set to original size

### Updated

- Adjusted the way sale tags are generated
- Changed Z-Index on quicksearch results
- Replace AddThis component with provider sharing links

## 1.11.2 (2023-06-29)

### Fixed

- Additional empty product removed from schema.org data on the product page
- Buy now button was skipping product page option validation
- Recaptcha issue on password reset page

## 1.11.1 (2023-04-19)

### Updated

- Package.json cleanup

## 1.11.0 (2023-04-01)

### Fixed

- Buy now button now doesn't show on pre-order products
- Warranty box now has a top margin if next to extra information container
- Availability field displays independently of stock information
- Quick view margins/padding issues
- Optimized checkout fonts now reflect main theme fonts
- Carousel slide without content was 1px high
- Issue with hidden featured categories label showing when contextual navigation disabled
- Full page width and multi-add templates were missing page builder regions
- Product page thumbnail sizing
- Paypal Credit banners now appear correctly in all regions
- Issue with ghost item in Schema data

### Added

- People watching this item conversion booster
- Recent sales popup conversion booster
- Cart countdown timer conversion booster
- Alert bar color options
- Options to rearrage product sections on the homepage

### Updated

- Stencil utils search sorting
- Webpack to version 5 to support Node 18

## 1.10.2 (2023-02-08)

### Added

- Option to show extra information below the product description

### Updated

- Blog listing page limit from 5 to 12

### Fixed

- Videos added through the WYSIWYG editor were breaking layout on PDP
- Issue with product page add to cart form being duplicated causing quantity box to be ignored

## 1.10.1 (2023-01-31)

### Fixed

- Product grid layout on brand pages

## 1.10.0 (2023-01-18)

### Added

- Performance update; added option to use system font stack
- Header to recently viewed page in account section
- Warning color to stock label when below stock level
- Option to hide breadcrumbs on both desktop and mobile
- Bug fix stream in custom CSS options
- Resource hints for CDN helper to improve page speed load times

### Updated

- Spacing of header elements when Add to SKU option is hidden
- Clear icon in Quick Search
- Sign in sections to better reflect theme design
- Description on PDP has a two column layout when extra information is added
- PDP buy section freshened up and now works better when scaling down to mobile
- Review section on PDP so header and pagination are inside the panel
- Product cards freshened up and now work better when scaling down to mobile
- Product carousels so column number is better suited for all breakpoints
- Mobile menu account link to use the same text as desktop
- New theme editor panel layout
- Replace schema microdata with LD+JSON tag
- Bump Stencil Utils to v6

### Fixed

- Search and quick add didn't show after customer login when lockdown option was set to hide entire catalog
- Show sale tags correctly, only when there is a sale price
- Add to SKU field in header to work better with different font sizes
- Code to allow UPCs to show on variations that do not have a base UPC set
- Recently viewed product grid in account section
- PDP thumbnails now change size with theme editor option
- Featured category buttons so they use the secondary button color options
- Focus bug for mobile navigation search bar

### Removed

- Hide "Featured Categories" title option as it's not needed
- Sanitize from the short description field
- Google AMP support as BigCommerce are phasing out support in the control panel

## 1.9.0 (2022-01-28)

### Fixed

- Added pagination for favourites lists

### Added

- Buy Now button option for the product page
- Empty Cart button to clear multiple items at once
- One Click email login mode for homepage

### Added

- Option to show "Buy now" button on product page

## 1.8.4 (2021-12-15)

### Fixed

- Issue with invoice printing only first order on orders page in account

## 1.8.3 (2021-09-10)

### Updated

- Remove Promotional Pricing

## 1.8.2 (2021-08-27)

### Updated

- BC Theme Store Holiday Pricing
- Cache busting on Custom CSS

### Fixed

- Issue with custom fields not appearing if there is no product description

## 1.8.1 (2021-06-29)

### Fixed

- Z-index issue with compare checkbox on mobile devices
- Issues with quicksearch not passing settings correctly
- Search and add by SKU features now correctly hidden when lock down option is set to hide catalog for guests
- Missing mega menu styling

## 1.8.0 (2021-06-21)

### Changed

- New variation defaults
- Cookie Consent Manager now collapses to a link in the footer when accepted
- Wishlist buttons on cards are now separate from add to cart settings in control panel
- New header design
- Option to change header width to match global container width, relaxed or full width
- New quicksearch design
- Cleaned up mobile navigation

## Fixed

- Issue with wishlist not showing prices when restrict_to_login was set

## Added

- Three brand new navigation styles - Simple, Simple Enclosed and Mega Menu
- New navigation panel in theme editor
- Option to activate navigation dropdowns with hover instead of click
- SSL global region in footer
- Global container width control in theme editor > Theme Features panel

## 1.7.3 (2021-03-15)

### Updated
- Credit card vaulting update to align with platform changes
- Theme Store housekeeping
- Bumped Lodash

### Added
- Custom CSS support

## 1.7.2 (2021-01-25)

### Fixed
- Issue with add to cart button not showing on option change when initial selection is out of stock

## 1.7.1 (2020-11-02)

### Fixed

- Forgot password page access now allowed when storefront is locked down to only registered users
- Show More Facets popup now shows extra options

## 1.7.0 (2020-10-26)

### Changed

- Rebuilt logic on the category template to show side navigation components separately
- Tweaked shadow appearance on elements
- Adjusted width of shipping estimator fields in the cart
- Quick view modal closes when adding a product to the cart

### Fixed

- Availability field logic on product cards
- Stock levels show when changing options on product pages

### Added

- Global Page Builder regions
- Fields for custom Google fonts in theme editor

## 1.6.1 (2020-09-08)

### Updated
- Route "add to list" action to create a list page if no lists exist

### Fixed
- Hide Featured Categories in navigation control now hides them in the footer too

## 1.6.0 (2020-08-13)

### Added
- Use srcset for images with different loading options
- Added option for SVG logo

### Updated
- Updated lodash dependancy for improved security

### Fixed
- Header navigation with issue
- Add to wishlist menu on product listings since backend change

### Fixed
- Sanitize texts to stop HTML entities displaying
- Mobile Issue of last images in thumbnail slider unreachable if over 9 thumbnails
- Correct urls for account messages and order history on homepage
- Allow category header image to go full width
- Product card styles to use correct image size from theme settings

## 1.5.0 (2020-04-22)

### Added
- Control to stop newly created "ungrouped" accounts being able to see the catalogue and pricing

### Fixed
- Homepage hero content not showing when set to lockdown mode 2
- Display issue on account created screen
- Display issue with SVG icons focus state in header

## 1.4.0 (2020-04-16)

### Added
- Page Builder regions to homepage, content, category, product and article pages
- Page Builder regions to header and footer

### Fixed
- Issue with min-height being applied by sticky cart when page is short
- Cart bug where quantities would be changed after hitting enter key
- Wishlist bug where new wishlists could be created without a name and deleted without confirmation
- Positioning issue with new PayPal buttons
- Issue where an address could not be deleted in address list

## 1.3.0 (2019-08-06)

### Added
- Additional schema data for Google
- Controls for homepage login box colors in the theme editor

### Changed
- Handlebars scope for Options on returns page
- Switched off dynamic typing in the multi-add CSV import script
- Optimized SVG icons
- Align subcategories as a grid with padding
- Layout of compare page to accommodate more than 4 products
- Hide the description container on the product page if empty

### Fixed
- SKU fields now available on the product page even when master product has no SKU
- AMP iframe now loading correctly
- Stop add/remove buttons jumping around in Chrome and Safari on the multi-add page
- Add to cart script bug when quantity boxes are switched off
- Add to cart styling when quantity boxes are switched off
- Wishlist display switcher on account page
- Wishlist grid on account page
- Issue with hero slide 1 height on large screens
- Display issues in account/recent order details when order shipped to multiple locations

## 1.2.2 (2019-05-22)

### Changed
- Multi add form no longer removes form rows on success

### Fixed
- Bug with server responses when using quick add by SKU

## 1.2.1 (2019-04-23)

### Fixed
- Stock level only shows in search result when theme setting is enabled

## 1.2.0 (2019-04-17)

### Added
- Additional payment icons for the majority of Adyen services
- New save to list functionality, available in the B2B features panel in theme editor

### Fixed
- Sale tag now shows on the product page for sale items
- Issue with recent platform change to the faceted search system

### Removed
- Unnecessary font options in the optimized checkout settings in theme editor

## 1.1.0 (2019-04-09)

### Added
- New CSV upload feature on the add multiple SKUs page. Upload a 2 column CSV with a "sku" and "qty" heading to mass submit a cart
- Option to show product SKUs in the cart and mini cart
- Option to show the quantity already in cart on product cards and lists
- Google Pay, Alipay, WeChat Pay and UnionPay payment icons

### Changed
- Replaced Payment Font with SVG payment icons
- Optimized the mobile homepage

### Fixed
- Adjusted margins on the coupon and gift certificate boxes in the cart
- Restored borders to the header form inputs so they display correctly when the background is set to white
- Short description now appears on mobile product pages
- Adjusted some spacing issues with the product page image carousel
- View Full Description now links correctly in quick view modal

## 1.0.1 (2019-03-29)

### Added
- Option in theme editor to hide "ex. tax" label when only ex. tax prices are visible

### Changed
- Made the image panel on the product page sticky when products have a long options set

### Fixed
- Cleaned up the checkout page message when a minimum order value is set

## 1.0.0 (2019-03-19)
- Initial commit for the theme store
