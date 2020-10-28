// function addToCart(query) {
//     $.ajax({
//         url: '/add-to-cart' + query,
//         method: 'get',
//         success: (response) => {
//             if (response.status) {
//                 let count = $('#cartCount').html()
//                 count = parseInt(count) + 1
//                 $('#cartCount').html(count)

//             }
//         }
//     })
// }
///remove item from cart
function removeItem(proId) {
    $.ajax({
        url: '/remove-from-cart/' + proId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                location.reload();
            }
        }
    })
}

function changeQuantity(cartId, count) {
    $.ajax({
        url: '/change-quantity',
        data: {
            cart: cartId,
            count: count,
        },
        method: 'post',
        dataType: 'json',
        success: (response) => {
            if (response.removeProduct) {
                alert('Product removed from cart');
                location.reload();
            }
            document.getElementById(cartId).innerHTML = response.quantity;
            var id = 'summary' + cartId;
            document.getElementById(id).innerHTML = response.updatedPrice;
        }

    })
}

function calculateTotalAmount() {
    $.ajax({
        url: '/calculate-total-amount',
        method: 'get',
        success: (response) => {
            $('#totalAmountPage').show();
            $('#total').html(response);

        }
    })
}

