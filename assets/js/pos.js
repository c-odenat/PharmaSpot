const jsPDF = require("jspdf");
const html2canvas = require("html2canvas");
const JsBarcode = require("jsbarcode");
const macaddress = require("macaddress");
const notiflix = require("notiflix");
const validator = require("validator");
const DOMPurify = require("dompurify");
const _ = require("lodash");
let fs = require("fs");
let path = require("path");
let moment = require("moment");
let { ipcRenderer } = require("electron");
let dotInterval = setInterval(function () {
  $(".dot").text(".");
}, 3000);
let Store = require("electron-store");
const remote = require("@electron/remote");
const app = remote.app;
let cart = [];
let index = 0;
let allUsers = [];
let allProducts = [];
let allCategories = [];
let allTransactions = [];
let sold = [];
let state = [];
let sold_items = [];
let item;
let auth;
let holdOrder = 0;
let vat = 0;
let perms = null;
let deleteId = 0;
let paymentType = 0;
let receipt = "";
let totalVat = 0;
let subTotal = 0;
let method = "";
let order_index = 0;
let user_index = 0;
let product_index = 0;
let transaction_index;
const appName = process.env.APPNAME;
const appData = process.env.APPDATA;
let host = "localhost";
let port = process.env.PORT;
let img_path = path.join(appData, appName, "uploads", "/");
let api = "http://" + host + ":" + port + "/api/";
const bcrypt = require("bcrypt");
let categories = [];
let holdOrderList = [];
let customerOrderList = [];
let ownUserEdit = null;
let totalPrice = 0;
let orderTotal = 0;
let auth_error = "Incorrect username or password";
let auth_empty = "Please enter a username and password";
let holdOrderlocation = $("#renderHoldOrders");
let customerOrderLocation = $("#renderCustomerOrders");
let storage = new Store();
let settings;
let platform;
let user = {};
let start = moment().startOf("month");
let end = moment();
let start_date = moment(start).toDate();
let end_date = moment(end).toDate();
let by_till = 0;
let by_user = 0;
let by_status = 1;
const default_item_img = path.join("assets","images","default.jpg");
const permissions = [
  "perm_products",
  "perm_categories",
  "perm_transactions",
  "perm_users",
  "perm_settings",
];
notiflix.Notify.init({
  position: "right-top",
  cssAnimationDuration: 600,
  messageMaxLength: 150,
  clickToClose: true,
  closeButton: true
});
const {
  DATE_FORMAT,
  moneyFormat,
  isExpired,
  daysToExpire,
  getStockStatus,
  checkFileExists,
  setContentSecurityPolicy,
} = require("./utils");

//set the content security policy of the app
setContentSecurityPolicy();

$(function () {
  function cb(start, end) {
    $("#reportrange span").html(
      start.format("MMMM D, YYYY") + "  -  " + end.format("MMMM D, YYYY"),
    );
  }

  $("#reportrange").daterangepicker(
    {
      startDate: start,
      endDate: end,
      autoApply: true,
      timePicker: true,
      timePicker24Hour: true,
      timePickerIncrement: 10,
      timePickerSeconds: true,
      // minDate: '',
      ranges: {
        Today: [moment().startOf("day"), moment()],
        Yesterday: [
          moment().subtract(1, "days").startOf("day"),
          moment().subtract(1, "days").endOf("day"),
        ],
        "Last 7 Days": [
          moment().subtract(6, "days").startOf("day"),
          moment().endOf("day"),
        ],
        "Last 30 Days": [
          moment().subtract(29, "days").startOf("day"),
          moment().endOf("day"),
        ],
        "This Month": [moment().startOf("month"), moment().endOf("month")],
        "This Month": [moment().startOf("month"), moment()],
        "Last Month": [
          moment().subtract(1, "month").startOf("month"),
          moment().subtract(1, "month").endOf("month"),
        ],
      },
    },
    cb,
  );

  cb(start, end);

  $("#expirationDate").daterangepicker({
    singleDatePicker: true,
    locale: {
      format: DATE_FORMAT,
    },
  });
});

//Allow only numbers in input field
$.fn.allowOnlyNumbers = function() {
  return this.on('keydown', function(e) {
  // Allow: backspace, delete, tab, escape, enter, ., ctrl/cmd+A, ctrl/cmd+C, ctrl/cmd+X, ctrl/cmd+V, end, home, left, right, down, up
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 || 
      (e.keyCode >= 35 && e.keyCode <= 40) || 
      ((e.keyCode === 65 || e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 88) && (e.ctrlKey === true || e.metaKey === true))) {
      return;
  }
  // Ensure that it is a number and stop the keypress
  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
    e.preventDefault();
  }
});
};
$('.number-input').allowOnlyNumbers();

//Serialize Object
$.fn.serializeObject = function () {
  var o = {};
  var a = this.serializeArray();
  $.each(a, function () {
    if (o[this.name]) {
      if (!o[this.name].push) {
        o[this.name] = [o[this.name]];
      }
      o[this.name].push(this.value || "");
    } else {
      o[this.name] = this.value || "";
    }
  });
  return o;
};

auth = storage.get("auth");
user = storage.get("user");

$("#main_app").hide();
if (auth == undefined) {
  $.get(api + "users/check/", function (data) {});

  authenticate();
} else {
  $("#login").hide();
  $("#main_app").show();
  platform = storage.get("settings");

  if (platform != undefined) {
    if (platform.app == "Network Point of Sale Terminal") {
      api = "http://" + platform.ip + ":" + port + "/api/";
      perms = true;
    }
  }

  $.get(api + "users/user/" + user._id, function (data) {
    user = data;
    $("#loggedin-user").text(user.fullname);
    // Update status bar username
    $("#status-username").text(user.fullname || user.username);
  });

  $.get(api + "settings/get", function (data) {
    settings = data.settings;
  });

  $.get(api + "users/all", function (users) {
    allUsers = [...users];
  });

  $(document).ready(function () {
    //update title based on company
    let appTitle = !!settings ? `${validator.unescape(settings.store)} - ${appName}` : appName;
    $("title").text(appTitle);

    $(".loading").hide();

    loadCategories();
    loadProducts();
    loadCustomers();

    if (settings && validator.unescape(settings.symbol)) {
      $("#price_curr, #payment_curr, #change_curr").text(validator.unescape(settings.symbol));
    }

    setTimeout(function () {
      if (settings == undefined && auth != undefined) {
        $("#settingsModal").modal("show");
      } else {
        vat = parseFloat(validator.unescape(settings.percentage));
        $("#taxInfo").text(settings.charge_tax ? vat : 0);
      }
    }, 1500);

    $("#settingsModal").on("hide.bs.modal", function () {
      setTimeout(function () {
        if (settings == undefined && auth != undefined) {
          $("#settingsModal").modal("show");
        }
      }, 1000);
    });

    if (0 == user.perm_products) {
      $(".p_one").hide();
    }
    if (0 == user.perm_categories) {
      $(".p_two").hide();
    }
    if (0 == user.perm_transactions) {
      $(".p_three").hide();
    }
    if (0 == user.perm_users) {
      $(".p_four").hide();
    }
    if (0 == user.perm_settings) {
      $(".p_five").hide();
    }

    function loadProducts() {
      // Add cache-busting parameter to ensure fresh data
      $.ajax({
        url: api + "inventory/products",
        type: "GET",
        cache: false,
        success: function (data) {
          data.forEach((item) => {
            item.price = parseFloat(item.price).toFixed(2);
          });

          allProducts = [...data];

          loadProductList();

          let delay = 0;
          let expiredCount = 0;
          let expiringProducts = [];
          
          allProducts.forEach((product) => {
            let todayDate = moment();
            let expiryDate = moment(product.expirationDate, DATE_FORMAT);

            if (!isExpired(expiryDate)) {
              const diffDays = daysToExpire(expiryDate);

              if (diffDays > 0 && diffDays <= 30) {
                var days_noun = diffDays > 1 ? "days" : "day";
                // Use NotificationManager instead of notiflix
                if (window.NotificationManager) {
                  window.NotificationManager.add(
                    'warning',
                    `${product.name} has only ${diffDays} ${days_noun} left to expiry`,
                    `expiry_${product._id}`
                  );
                }
              }
            } else {
              expiredCount++;
            }
          });

          //Show notification if there are any expired goods.
          if(expiredCount>0)
          {
            // Use NotificationManager instead of notiflix
            if (window.NotificationManager) {
              window.NotificationManager.add(
                'danger',
                `${expiredCount} ${expiredCount > 1 ? "products" : "product"} expired. Please restock!`,
                `expired_count_${expiredCount}`
              );
            }
          }

         
          $("#parent").text("");

          data.forEach((item) => {
            if (!categories.includes(item.category)) {
              categories.push(item.category);
            }
            let item_isExpired = isExpired(item.expirationDate);
            let item_stockStatus = getStockStatus(item.quantity,item.minStock);
            if(item.img==="")
            {
              item_img = default_item_img;
            }
            else
            {
              item_img = path.join(img_path, item.img);
              item_img = checkFileExists(item_img) ? item_img : default_item_img;
            }
            

            let item_info = `<div class="col-lg-2 box ${item.category}"
                                  onclick="$(this).addToCart(${item._id}, ${
                                    item.quantity
                                  }, ${item.stock})">
                              <div class="widget-panel widget-style-2 " title="${item.name}">                    
                              <div id="image"><img src="${item_img}" id="product_img" alt=""></div>                    
                                          <div class="text-muted m-t-5 text-center">
                                          <div class="name" id="product_name"><span class="${
                                            item_isExpired ? "text-danger" : ""
                                          }">${item.name}</span></div> 
                                          <span class="sku">${
                                            item.barcode || item._id
                                          }</span>
                                          <span class="${item_stockStatus<1?'text-danger':''}"><span class="stock">STOCK </span><span class="count">${
                                            item.stock == 1
                                              ? item.quantity
                                              : "N/A"
                                          }</span></span></div>
                                          <span class="text-success text-center"><b data-plugin="counterup">${
                                            validator.unescape(settings.symbol) +
                                            moneyFormat(item.price)
                                          }</b> </span>
                              </div>
                          </div>`;
            $("#parent").append(item_info);
          });
        }
      });
    }

    function loadCategories() {
      $.get(api + "categories/all", function (data) {
        allCategories = data;
        loadCategoryList();
        $("#category,#categories").html(`<option value="0">Select</option>`);
        allCategories.forEach((category) => {
          $("#category,#categories").append(
            `<option value="${category._id}">${category.name}</option>`,
          );
        });
      });
    }

    function loadCustomers() {
      $.get(api + "customers/all", function (customers) {
        $("#customer").html(
          `<option value="0" selected="selected">Walk in customer</option>`,
        );

        customers.forEach((cust) => {
          let customer = `<option value='{"id": ${cust._id}, "name": "${cust.name}"}'>${cust.name}</option>`;
          $("#customer").append(customer);
        });
      });
    }

    $.fn.addToCart = function (id, count, stock) {
      $.get(api + "inventory/product/" + id, function (product) {
        if (isExpired(product.expirationDate)) {
          notiflix.Report.failure(
            "Expired",
            `${product.name} is expired! Please restock.`,
            "Ok",
          );
        } else {
          if (count > 0) {
            $(this).addProductToCart(product);
          } else {
            if (stock == 1) {
              notiflix.Report.failure(
                "Out of stock!",
                `${product.name} is out of stock! Please restock.`,
                "Ok",
              );
            }
          }
        }
      });
    };

    function barcodeSearch(e) {
      e.preventDefault();
      let searchBarCodeIcon = $(".search-barcode-btn").html();
      $(".search-barcode-btn").empty();
      $(".search-barcode-btn").append(
        $("<i>", { class: "fa fa-spinner fa-spin" }),
      );

      let req = {
        skuCode: $("#skuCode").val(),
      };

      $.ajax({
        url: api + "inventory/product/sku",
        type: "POST",
        data: JSON.stringify(req),
        contentType: "application/json; charset=utf-8",
        cache: false,
        processData: false,
        success: function (product) {
          $(".search-barcode-btn").html(searchBarCodeIcon);
          const expired = isExpired(product.expirationDate);
          if (product._id != undefined && product.quantity >= 1 && !expired) {
            $(this).addProductToCart(product);
            $("#searchBarCode").get(0).reset();
            $("#basic-addon2").empty();
            $("#basic-addon2").append(
              $("<i>", { class: "glyphicon glyphicon-ok" }),
            );
          } else if (expired) {
            notiflix.Report.failure(
              "Expired!",
              `${product.name} is expired`,
              "Ok",
            );
          } else if (product.quantity < 1) {
            notiflix.Report.info(
              "Out of stock!",
              "This item is currently unavailable",
              "Ok",
            );
          } else {
            notiflix.Report.warning(
              "Not Found!",
              "<b>" + $("#skuCode").val() + "</b> is not a valid barcode!",
              "Ok",
            );

            $("#searchBarCode").get(0).reset();
            $("#basic-addon2").empty();
            $("#basic-addon2").append(
              $("<i>", { class: "glyphicon glyphicon-ok" }),
            );
          }
        },
        error: function (err) {
          if (err.status === 422) {
            $(this).showValidationError(data);
            $("#basic-addon2").append(
              $("<i>", { class: "glyphicon glyphicon-remove" }),
            );
          } else if (err.status === 404) {
            $("#basic-addon2").empty();
            $("#basic-addon2").append(
              $("<i>", { class: "glyphicon glyphicon-remove" }),
            );
          } else {
            $(this).showServerError();
            $("#basic-addon2").empty();
            $("#basic-addon2").append(
              $("<i>", { class: "glyphicon glyphicon-warning-sign" }),
            );
          }
        },
      });
    }

    $("#searchBarCode").on("submit", function (e) {
      barcodeSearch(e);
    });

    $("body").on("click", "#jq-keyboard button", function (e) {
      let pressed = $(this)[0].className.split(" ");
      if ($("#skuCode").val() != "" && pressed[2] == "enter") {
        barcodeSearch(e);
      }
    });

    $.fn.addProductToCart = function (data) {
      item = {
        id: data._id,
        product_name: data.name,
        sku: data.sku,
        price: data.price,
        quantity: 1,
        category: data.category,
      };

      if ($(this).isExist(item)) {
        $(this).qtIncrement(index);
      } else {
        cart.push(item);
        $(this).renderTable(cart);
      }
    };

    $.fn.isExist = function (data) {
      let toReturn = false;
      $.each(cart, function (index, value) {
        if (value.id == data.id) {
          $(this).setIndex(index);
          toReturn = true;
        }
      });
      return toReturn;
    };

    $.fn.setIndex = function (value) {
      index = value;
    };

    $.fn.calculateCart = function () {
      let total = 0;
      let grossTotal;
      let total_items = 0;
      $.each(cart, function (index, data) {
        total += data.quantity * data.price;
        total_items += parseInt(data.quantity);
      });
      $("#total").text(total_items);
      total = total - $("#inputDiscount").val();
      $("#price").text(validator.unescape(settings.symbol) + moneyFormat(total.toFixed(2)));

      subTotal = total;

      if ($("#inputDiscount").val() >= total) {
        $("#inputDiscount").val(0);
      }

      if (settings.charge_tax) {
        totalVat = (total * vat) / 100;
        grossTotal = total + totalVat;
      } else {
        grossTotal = total;
      }

      orderTotal = grossTotal.toFixed(2);

      $("#gross_price").text(validator.unescape(settings.symbol) + moneyFormat(orderTotal));
      $("#payablePrice").val(moneyFormat(grossTotal));
    };

    $.fn.renderTable = function (cartList) {
      $("#cartTable .card-body").empty();
      $(this).calculateCart();
      $.each(cartList, function (index, data) {
        $("#cartTable .card-body").append(
          $("<div>", { class: "row m-t-10" }).append(
            $("<div>", { class: "col-md-1", text: index + 1 }),
            $("<div>", { class: "col-md-3", text: data.product_name }),
            $("<div>", { class: "col-md-3" }).append(
              $("<div>", { class: "input-group" }).append(
                $("<span>", { class: "input-group-btn" }).append(
                  $("<button>", {
                    class: "btn btn-light",
                    onclick: "$(this).qtDecrement(" + index + ")",
                  }).append($("<i>", { class: "fa fa-minus" })),
                ),
                $("<input>", {
                  class: "form-control",
                  type: "text",
                  readonly: "",
                  value: data.quantity,
                  min: "1",
                  onInput: "$(this).qtInput(" + index + ")",
                }),
                $("<span>", { class: "input-group-btn" }).append(
                  $("<button>", {
                    class: "btn btn-light",
                    onclick: "$(this).qtIncrement(" + index + ")",
                  }).append($("<i>", { class: "fa fa-plus" })),
                ),
              ),
            ),
            $("<div>", {
              class: "col-md-3",
              text:
                validator.unescape(settings.symbol) +
                moneyFormat((data.price * data.quantity).toFixed(2)),
            }),
            $("<div>", { class: "col-md-1" }).append(
              $("<button>", {
                class: "btn btn-light btn-xs",
                onclick: "$(this).deleteFromCart(" + index + ")",
              }).append($("<i>", { class: "fa fa-times" })),
            ),
          ),
        );
      });
    };

    $.fn.deleteFromCart = function (index) {
      cart.splice(index, 1);
      $(this).renderTable(cart);
    };

    $.fn.qtIncrement = function (i) {
      item = cart[i];
      let product = allProducts.filter(function (selected) {
        return selected._id == parseInt(item.id);
      });

      if (product[0].stock == 1) {
        if (item.quantity < product[0].quantity) {
          item.quantity = parseInt(item.quantity) + 1;
          $(this).renderTable(cart);
        } else {
          notiflix.Report.info(
            "No more stock!",
            "You have already added all the available stock.",
            "Ok",
          );
        }
      } else {
        item.quantity = parseInt(item.quantity) + 1;
        $(this).renderTable(cart);
      }
    };

    $.fn.qtDecrement = function (i) {
      if (item.quantity > 1) {
        item = cart[i];
        item.quantity = parseInt(item.quantity) - 1;
        $(this).renderTable(cart);
      }
    };

    $.fn.qtInput = function (i) {
      item = cart[i];
      item.quantity = $(this).val();
      $(this).renderTable(cart);
    };

    $.fn.cancelOrder = function () {
      if (cart.length > 0) {
        const diagOptions = {
          title: "Are you sure?",
          text: "You are about to remove all items from the cart.",
          icon: "warning",
          showCancelButton: true,
          okButtonText: "Yes, clear it!",
          cancelButtonText: "Cancel",
          options: {
            // okButtonBackground: "#3085d6",
            cancelButtonBackground: "#d33",
          },
        };

        notiflix.Confirm.show(
          diagOptions.title,
          diagOptions.text,
          diagOptions.okButtonText,
          diagOptions.cancelButtonText,
          () => {
            cart = [];
            $(this).renderTable(cart);
            holdOrder = 0;
            notiflix.Report.success(
              "Cleared!",
              "All items have been removed.",
              "Ok",
            );
          },
          "",
          diagOptions.options,
        );
      }
    };

    $("#payButton").on("click", function () {
      if (cart.length != 0) {
        $("#paymentModel").modal("toggle");
      } else {
        notiflix.Report.warning("Oops!", "There is nothing to pay!", "Ok");
      }
    });

    $("#hold").on("click", function () {
      if (cart.length != 0) {
        $("#dueModal").modal("toggle");
      } else {
        notiflix.Report.warning("Oops!", "There is nothing to hold!", "Ok");
      }
    });

    function printJobComplete() {
      notiflix.Report.success("Done", "print job complete", "Ok");
    }

    $.fn.submitDueOrder = function (status) {
      let items = "";
      let payment = 0;
      paymentType = $('.list-group-item.active').data('payment-type');
      cart.forEach((item) => {
    items += `<tr><td>${DOMPurify.sanitize(item.product_name)}</td><td>${
      DOMPurify.sanitize(item.quantity)
    } </td><td class="text-right"> ${DOMPurify.sanitize(validator.unescape(settings.symbol))} ${moneyFormat(
      DOMPurify.sanitize(Math.abs(item.price).toFixed(2)),
    )} </td></tr>`;
});

      let currentTime = new Date(moment());
      let discount = $("#inputDiscount").val();
      let customer = JSON.parse($("#customer").val());
      let date = moment(currentTime).format("YYYY-MM-DD HH:mm:ss");
      let paymentAmount = $("#payment").val().replace(",", "");
      let changeAmount = $("#change").text().replace(",", "");
      let paid =
        $("#payment").val() == "" ? "" : parseFloat(paymentAmount).toFixed(2);
      let change =
        $("#change").text() == "" ? "" : parseFloat(changeAmount).toFixed(2);
      let refNumber = $("#refNumber").val();
      let orderNumber = holdOrder;
      let type = "";
      let tax_row = "";
      switch (paymentType) {
        case 1:
          type = "Cash";
          break;
        case 3:
          type = "Mobile Money";
          break;
      }

      if (paid != "") {
        payment = `<tr>
                        <td>Paid</td>
                        <td>:</td>
                        <td class="text-right">${validator.unescape(settings.symbol)} ${moneyFormat(
                          Math.abs(paid).toFixed(2),
                        )}</td>
                    </tr>
                    <tr>
                        <td>Change</td>
                        <td>:</td>
                        <td class="text-right">${validator.unescape(settings.symbol)} ${moneyFormat(
                          Math.abs(change).toFixed(2),
                        )}</td>
                    </tr>
                    <tr>
                        <td>Method</td>
                        <td>:</td>
                        <td class="text-right">${type}</td>
                    </tr>`;
      }

      if (settings.charge_tax) {
        tax_row = `<tr>
                    <td>VAT(${validator.unescape(settings.percentage)})% </td>
                    <td>:</td>
                    <td class="text-right">${validator.unescape(settings.symbol)} ${moneyFormat(
                      parseFloat(totalVat).toFixed(2),
                    )}</td>
                </tr>`;
      }

      if (status == 0) {
        if ($("#customer").val() == 0 && $("#refNumber").val() == "") {
          notiflix.Report.warning(
            "Reference Required!",
            "You either need to select a customer <br> or enter a reference!",
            "Ok",
          );
          return;
        }
      }

      $(".loading").show();

      if (holdOrder != 0) {
        orderNumber = holdOrder;
        method = "PUT";
      } else {
        orderNumber = Math.floor(Date.now() / 1000);
        method = "POST";
      }

      logo = path.join(img_path, validator.unescape(settings.img));

      receipt = `<div style="font-size: 10px">                            
        <p style="text-align: center;">
        ${
          checkFileExists(logo)
            ? `<img style='max-width: 50px' src='${logo}' /><br>`
            : ``
        }
            <span style="font-size: 22px;">${validator.unescape(settings.store)}</span> <br>
            ${validator.unescape(settings.address_one)} <br>
            ${validator.unescape(settings.address_two)} <br>
            ${
              validator.unescape(settings.contact) != "" ? "Tel: " + validator.unescape(settings.contact) + "<br>" : ""
            } 
            ${validator.unescape(settings.tax) != "" ? "Vat No: " + validator.unescape(settings.tax) + "<br>" : ""} 
        </p>
        <hr>
        <left>
            <p>
            Order No : ${orderNumber} <br>
            Ref No : ${refNumber == "" ? orderNumber : _.escape(refNumber)} <br>
            Customer : ${
              customer == 0 ? "Walk in customer" : _.escape(customer.name)
            } <br>
            Cashier : ${user.fullname} <br>
            Date : ${date}<br>
            </p>

        </left>
        <hr>
        <table width="90%">
            <thead>
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th class="text-right">Price</th>
            </tr>
            </thead>
            <tbody>
             ${items}                
            <tr><td colspan="3"><hr></td></tr>
            <tr>                        
                <td><b>Subtotal</b></td>
                <td>:</td>
                <td class="text-right"><b>${validator.unescape(settings.symbol)}${moneyFormat(
                  subTotal.toFixed(2),
                )}</b></td>
            </tr>
            <tr>
                <td>Discount</td>
                <td>:</td>
                <td class="text-right">${
                  discount > 0
                    ? validator.unescape(settings.symbol) +
                      moneyFormat(parseFloat(discount).toFixed(2))
                    : ""
                }</td>
            </tr>
            ${tax_row}
            <tr>
                <td><h5>Total</h5></td>
                <td><h5>:</h5></td>
                <td class="text-right">
                    <h5>${validator.unescape(settings.symbol)} ${moneyFormat(
                      parseFloat(orderTotal).toFixed(2),
                    )}</h3>
                </td>
            </tr>
            ${payment == 0 ? "" : payment}
            </tbody>
            </table>
            <br>
            <hr>
            <br>
            <p style="text-align: center;">
             ${validator.unescape(settings.footer)}
             </p>
            </div>`;

      if (status == 3) {
        if (cart.length > 0) {
          printJS({ printable: receipt, type: "raw-html" });

          $(".loading").hide();
          return;
        } else {
          $(".loading").hide();
          return;
        }
      }

      let data = {
        order: orderNumber,
        ref_number: refNumber,
        discount: discount,
        customer: customer,
        status: status,
        subtotal: parseFloat(subTotal).toFixed(2),
        tax: totalVat,
        order_type: 1,
        items: cart,
        date: currentTime,
        payment_type: type,
        payment_info: $("#paymentInfo").val(),
        total: orderTotal,
        paid: paid,
        change: change,
        _id: orderNumber,
        till: platform.till,
        mac: platform.mac,
        user: user.fullname,
        user_id: user._id,
      };

      $.ajax({
        url: api + "new",
        type: method,
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        cache: false,
        processData: false,
        success: function (data) {
          cart = [];
          receipt = DOMPurify.sanitize(receipt,{ ALLOW_UNKNOWN_PROTOCOLS: true });
          $("#viewTransaction").html("");
          $("#viewTransaction").html(receipt);
          $("#orderModal").modal("show");
          
          // Refresh products with cache-busting
          setTimeout(function() {
            loadProducts();
            loadCustomers();
          }, 300);
          
          $(".loading").hide();
          $("#dueModal").modal("hide");
          $("#paymentModel").modal("hide");
          
          // Fix context for these calls
          $.fn.getHoldOrders();
          $.fn.getCustomerOrders();
          $.fn.renderTable(cart);
        },

        error: function (data) {
          $(".loading").hide();
          $("#dueModal").modal("toggle");
          notiflix.Report.failure(
            "Something went wrong!",
            "Please refresh this page and try again",
            "Ok",
          );
        },
      });

      $("#refNumber").val("");
      $("#change").text("");
      $("#payment,#paymentText").val("");
    };

    $.get(api + "on-hold", function (data) {
      holdOrderList = data;
      holdOrderlocation.empty();
      // clearInterval(dotInterval);
      $(this).renderHoldOrders(holdOrderList, holdOrderlocation, 1);
    });

    $.fn.getHoldOrders = function () {
      $.get(api + "on-hold", function (data) {
        holdOrderList = data;
        clearInterval(dotInterval);
        holdOrderlocation.empty();
        $(this).renderHoldOrders(holdOrderList, holdOrderlocation, 1);
      });
    };

    $.fn.renderHoldOrders = function (data, renderLocation, orderType) {
      $.each(data, function (index, order) {
        $(this).calculatePrice(order);
        renderLocation.append(
          $("<div>", {
            class:
              orderType == 1 ? "col-md-3 order" : "col-md-3 customer-order",
          }).append(
            $("<a>").append(
              $("<div>", { class: "card-box order-box" }).append(
                $("<p>").append(
                  $("<b>", { text: "Ref :" }),
                  $("<span>", { text: order.ref_number, class: "ref_number" }),
                  $("<br>"),
                  $("<b>", { text: "Price :" }),
                  $("<span>", {
                    text: order.total,
                    class: "label label-info",
                    style: "font-size:14px;",
                  }),
                  $("<br>"),
                  $("<b>", { text: "Items :" }),
                  $("<span>", { text: order.items.length }),
                  $("<br>"),
                  $("<b>", { text: "Customer :" }),
                  $("<span>", {
                    text:
                      order.customer != 0
                        ? order.customer.name
                        : "Walk in customer",
                    class: "customer_name",
                  }),
                ),
                $("<button>", {
                  class: "btn btn-danger del",
                  onclick:
                    "$(this).deleteOrder(" + index + "," + orderType + ")",
                }).append($("<i>", { class: "fa fa-trash" })),

                $("<button>", {
                  class: "btn btn-default",
                  onclick:
                    "$(this).orderDetails(" + index + "," + orderType + ")",
                }).append($("<span>", { class: "fa fa-shopping-basket" })),
              ),
            ),
          ),
        );
      });
    };

    $.fn.calculatePrice = function (data) {
      totalPrice = 0;
      $.each(data.products, function (index, product) {
        totalPrice += product.price * product.quantity;
      });

      let vat = (totalPrice * data.vat) / 100;
      totalPrice = (totalPrice + vat - data.discount).toFixed(0);

      return totalPrice;
    };

    $.fn.orderDetails = function (index, orderType) {
      $("#refNumber").val("");

      if (orderType == 1) {
        $("#refNumber").val(holdOrderList[index].ref_number);

        $("#customer option:selected").removeAttr("selected");

        $("#customer option")
          .filter(function () {
            return $(this).text() == "Walk in customer";
          })
          .prop("selected", true);

        holdOrder = holdOrderList[index]._id;
        cart = [];
        $.each(holdOrderList[index].items, function (index, product) {
          item = {
            id: product.id,
            product_name: product.product_name,
            sku: product.sku,
            price: product.price,
            quantity: product.quantity,
          };
          cart.push(item);
        });
      } else if (orderType == 2) {
        $("#refNumber").val("");

        $("#customer option:selected").removeAttr("selected");

        $("#customer option")
          .filter(function () {
            return $(this).text() == customerOrderList[index].customer.name;
          })
          .prop("selected", true);

        holdOrder = customerOrderList[index]._id;
        cart = [];
        $.each(customerOrderList[index].items, function (index, product) {
          item = {
            id: product.id,
            product_name: product.product_name,
            sku: product.sku,
            price: product.price,
            quantity: product.quantity,
          };
          cart.push(item);
        });
      }
      $(this).renderTable(cart);
      $("#holdOrdersModal").modal("hide");
      $("#customerModal").modal("hide");
    };

    $.fn.deleteOrder = function (index, type) {
      switch (type) {
        case 1:
          deleteId = holdOrderList[index]._id;
          break;
        case 2:
          deleteId = customerOrderList[index]._id;
      }

      let data = {
        orderId: deleteId,
      };
      let diagOptions = {
        title: "Delete order?",
        text: "This will delete the order. Are you sure you want to delete!",
        icon: "warning",
        showCancelButton: true,
        okButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        okButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      };

      notiflix.Confirm.show(
        diagOptions.title,
        diagOptions.text,
        diagOptions.okButtonText,
        diagOptions.cancelButtonText,
        () => {
          $.ajax({
            url: api + "delete",
            type: "POST",
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            cache: false,
            success: function (data) {
              $(this).getHoldOrders();
              $(this).getCustomerOrders();

              notiflix.Report.success(
                "Deleted!",
                "You have deleted the order!",
                "Ok",
              );
            },
            error: function (data) {
              $(".loading").hide();
            },
          });
        },
      );
    };

    $.fn.getCustomerOrders = function () {
      $.get(api + "customer-orders", function (data) {
        //clearInterval(dotInterval);
        customerOrderList = data;
        customerOrderLocation.empty();
        $(this).renderHoldOrders(customerOrderList, customerOrderLocation, 2);
      });
    };

    $("#saveCustomer").on("submit", function (e) {
      e.preventDefault();

      let custData = {
        _id: Math.floor(Date.now() / 1000),
        name: $("#userName").val(),
        phone: $("#phoneNumber").val(),
        email: $("#emailAddress").val(),
        address: $("#userAddress").val(),
      };

      $.ajax({
        url: api + "customers/customer",
        type: "POST",
        data: JSON.stringify(custData),
        contentType: "application/json; charset=utf-8",
        cache: false,
        processData: false,
        success: function (data) {
          $("#newCustomer").modal("hide");
          notiflix.Report.success(
            "Customer added!",
            "Customer added successfully!",
            "Ok",
          );
          $("#customer option:selected").removeAttr("selected");
          $("#customer").append(
            $("<option>", {
              text: custData.name,
              value: `{"id": ${custData._id}, "name": ${custData.name}}`,
              selected: "selected",
            }),
          );

          $("#customer")
            .val(`{"id": ${custData._id}, "name": ${custData.name}}`)
            .trigger("chosen:updated");
        },
        error: function (data) {
          $("#newCustomer").modal("hide");
          notiflix.Report.failure(
            "Error",
            "Something went wrong please try again",
            "Ok",
          );
        },
      });
    });

    $("#confirmPayment").hide();

    $("#cardInfo").hide();

    $("#payment").on("input", function () {
      $(this).calculateChange();
    });
    $("#confirmPayment").on("click", function () {
      if ($("#payment").val() == "") {
        notiflix.Report.warning(
          "Nope!",
          "Please enter the amount that was paid!",
          "Ok",
        );
      } else {
        $(this).submitDueOrder(1);
      }
    });

    $("#transactions").on("click", function () {
      loadTransactions();
      loadUserList();

      $("#pos_view").hide();
      $("#pointofsale").show();
      $("#transactions_view").show();
      $(this).hide();
    });

    $("#pointofsale").on("click", function () {
      $("#pos_view").show();
      $("#transactions").show();
      $("#transactions_view").hide();
      $(this).hide();
    });

    $("#viewRefOrders").on("click", function () {
      setTimeout(function () {
        $("#holdOrderInput").focus();
      }, 500);
    });

    $("#viewCustomerOrders").on("click", function () {
      setTimeout(function () {
        $("#holdCustomerOrderInput").focus();
      }, 500);
    });

    $("#newProductModal").on("click", function () {
      $("#saveProduct").get(0).reset();
      $("#current_img").text("");
      loadSuppliersDropdown();
    });

    // Load suppliers into product dropdown
    function loadSuppliersDropdown() {
      $.get(api + "suppliers/all", function (data) {
        let dropdown = $("#product_supplier");
        dropdown.html('<option value="">Select Supplier</option>');
        data.forEach(supplier => {
          dropdown.append(`<option value="${supplier._id}">${validator.unescape(supplier.name)}</option>`);
        });
      }).fail(function() {
        // Silently fail if suppliers API not available
      });
    }

    $("#saveProduct").submit(function (e) {
      e.preventDefault();

      $(this).attr("action", api + "inventory/product");
      $(this).attr("method", "POST");

      $(this).ajaxSubmit({
        contentType: "application/json",
        success: function (response) {
          $("#saveProduct").get(0).reset();
          $("#current_img").text("");

          loadProducts();
          diagOptions = {
            title: "Product Saved",
            text: "Select an option below to continue.",
            okButtonText: "Add another",
            cancelButtonText: "Close",
          };

          notiflix.Confirm.show(
            diagOptions.title,
            diagOptions.text,
            diagOptions.okButtonText,
            diagOptions.cancelButtonText,
            ()=>{},
            () => {
              $("#newProduct").modal("hide");
            },
          );
        },
        //error for product
       error: function (jqXHR,textStatus, errorThrown) {
      console.error(jqXHR.responseJSON.message);
      notiflix.Report.failure(
        jqXHR.responseJSON.error,
        jqXHR.responseJSON.message,
        "Ok",
      );
      }

      });
    });

    $("#saveCategory").submit(function (e) {
      e.preventDefault();

      if ($("#category_id").val() == "") {
        method = "POST";
      } else {
        method = "PUT";
      }

      $.ajax({
        type: method,
        url: api + "categories/category",
        data: $(this).serialize(),
        success: function (data, textStatus, jqXHR) {
          $("#saveCategory").get(0).reset();
          loadCategories();
          loadProducts();
          diagOptions = {
            title: "Category Saved",
            text: "Select an option below to continue.",
            okButtonText: "Add another",
            cancelButtonText: "Close",
          };

          notiflix.Confirm.show(
            diagOptions.title,
            diagOptions.text,
            diagOptions.okButtonText,
            diagOptions.cancelButtonText,
            ()=>{},

            () => {
                $("#newCategory").modal("hide");
            },
          );
        },
      });
    });

    $.fn.editProduct = function (index) {
      $("#Products").modal("hide");

      $("#category option")
        .filter(function () {
          return $(this).val() == allProducts[index].category;
        })
        .prop("selected", true);

      $("#productName").val(allProducts[index].name);
      $("#product_price").val(allProducts[index].price);
      $("#quantity").val(allProducts[index].quantity);
      $("#barcode").val(allProducts[index].barcode || allProducts[index]._id);
      $("#expirationDate").val(allProducts[index].expirationDate);
      $("#minStock").val(allProducts[index].minStock || 1);
      $("#product_id").val(allProducts[index]._id);
      $("#img").val(allProducts[index].img);

      if (allProducts[index].img != "") {
        $("#imagename").hide();
        $("#current_img").html(
          `<img src="${img_path + allProducts[index].img}" alt="">`,
        );
        $("#rmv_img").show();
      }

      if (allProducts[index].stock == 0) {
        $("#stock").prop("checked", true);
      }

      $("#newProduct").modal("show");
    };

    $("#userModal").on("hide.bs.modal", function () {
      $(".perms").hide();
    });

    $.fn.editUser = function (index) {
      user_index = index;

      $("#Users").modal("hide");

      $(".perms").show();

      $("#user_id").val(allUsers[index]._id);
      $("#fullname").val(allUsers[index].fullname);
      $("#username").val(validator.unescape(allUsers[index].username));
      $("#password").attr("placeholder", "New Password");
    

      for (perm of permissions) {
        var el = "#" + perm;
        if (allUsers[index][perm] == 1) {
          $(el).prop("checked", true);
        } else {
          $(el).prop("checked", false);
        }
      }

      $("#userModal").modal("show");
    };

    $.fn.editCategory = function (index) {
      $("#Categories").modal("hide");
      $("#categoryName").val(allCategories[index].name);
      $("#category_id").val(allCategories[index]._id);
      $("#newCategory").modal("show");
    };

    $.fn.deleteProduct = function (id) {
      diagOptions = {
        title: "Are you sure?",
        text: "You are about to delete this product.",
        okButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      };

      notiflix.Confirm.show(
        diagOptions.title,
        diagOptions.text,
        diagOptions.okButtonText,
        diagOptions.cancelButtonText,
        () => {
          $.ajax({
            url: api + "inventory/product/" + id,
            type: "DELETE",
            success: function (result) {
              loadProducts();
              notiflix.Report.success("Done!", "Product deleted", "Ok");
            },
          });
        },
      );
    };

    $.fn.deleteUser = function (id) {
      diagOptions = {
        title: "Are you sure?",
        text: "You are about to delete this user.",
        cancelButtonColor: "#d33",
        okButtonText: "Yes, delete!",
      };

      notiflix.Confirm.show(
        diagOptions.title,
        diagOptions.text,
        diagOptions.okButtonText,
        diagOptions.cancelButtonText,
        () => {
          $.ajax({
            url: api + "users/user/" + id,
            type: "DELETE",
            success: function (result) {
              loadUserList();
              notiflix.Report.success("Done!", "User deleted", "Ok");
            },
          });
        },
      );
    };

    $.fn.deleteCategory = function (id) {
      diagOptions = {
        title: "Are you sure?",
        text: "You are about to delete this category.",
        okButtonText: "Yes, delete it!",
      };

      notiflix.Confirm.show(
        diagOptions.title,
        diagOptions.text,
        diagOptions.okButtonText,
        diagOptions.cancelButtonText,
        () => {
          $.ajax({
            url: api + "categories/category/" + id,
            type: "DELETE",
            success: function (result) {
              loadCategories();
              notiflix.Report.success("Done!", "Category deleted", "Ok");
            },
          });
        },
      );
    };

    $("#productModal").on("click", function () {
      loadProductList();
    });

    $("#usersModal").on("click", function () {
      loadUserList();
    });

    $("#categoryModal").on("click", function () {
      loadCategoryList();
    });

    function loadUserList() {
      let counter = 0;
      let user_list = "";
      $("#user_list").empty();
      $("#userList").DataTable().destroy();

      $.get(api + "users/all", function (users) {
        allUsers = [...users];

        users.forEach((user, index) => {
          state = [];
          let class_name = "";

          if (user.status != "") {
            state = user.status.split("_");
            login_status = state[0];
            login_time = state[1];

            switch (login) {
              case "Logged In":
                class_name = "btn-default";

                break;
              case "Logged Out":
                class_name = "btn-light";
                break;
            }
          }

          counter++;
          user_list += `<tr>
            <td>${user.fullname}</td>
            <td>${user.username}</td>
            <td class="${class_name}">${
              state.length > 0 ? login_status : ""
            } <br><small> ${state.length > 0 ? login_time : ""}</small></td>
            <td>${
              user._id == 1
                ? '<span class="btn-group"><button class="btn btn-dark"><i class="fa fa-edit"></i></button><button class="btn btn-dark"><i class="fa fa-trash"></i></button></span>'
                : '<span class="btn-group"><button onClick="$(this).editUser(' +
                  index +
                  ')" class="btn btn-warning"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteUser(' +
                  user._id +
                  ')" class="btn btn-danger"><i class="fa fa-trash"></i></button></span>'
            }</td></tr>`;

          if (counter == users.length) {
            $("#user_list").html(user_list);

            $("#userList").DataTable({
              order: [[1, "desc"]],
              autoWidth: false,
              info: true,
              JQueryUI: true,
              ordering: true,
              paging: false,
            });
          }
        });
      });
    }

    function loadProductList() {
      let products = [...allProducts];
      let product_list = "";
      let counter = 0;
      $("#product_list").empty();
      $("#productList").DataTable().destroy();

      products.forEach((product, index) => {
        counter++;

        let category = allCategories.filter(function (category) {
          return category._id == product.category;
        });

        product.stockAlert = "";
        const todayDate = moment();
        const expiryDate = moment(product.expirationDate, DATE_FORMAT);

        //show stock status indicator
        const stockStatus = getStockStatus(product.quantity,product.minStock);
          if(stockStatus<=0)
          {
          if (stockStatus === 0) {
            product.stockStatus = "No Stock";
            icon = "fa fa-exclamation-triangle";
          }
          if (stockStatus === -1) {
            product.stockStatus = "Low Stock";
            icon = "fa fa-caret-down";
          }

          product.stockAlert = `<p class="text-danger"><small><i class="${icon}"></i> ${product.stockStatus}</small></p>`;
        }
        //calculate days to expiry
        product.expiryAlert = "";
        if (!isExpired(expiryDate)) {
          const diffDays = daysToExpire(expiryDate);

          if (diffDays > 0 && diffDays <= 30) {
            var days_noun = diffDays > 1 ? "days" : "day";
            icon = "fa fa-clock-o";
            product.expiryStatus = `${diffDays} ${days_noun} left`;
            product.expiryAlert = `<p class="text-danger"><small><i class="${icon}"></i> ${product.expiryStatus}</small></p>`;
          }
        } else {
          icon = "fa fa-exclamation-triangle";
          product.expiryStatus = "Expired";
          product.expiryAlert = `<p class="text-danger"><small><i class="${icon}"></i> ${product.expiryStatus}</small></p>`;
        }

        if(product.img==="")
        {
          product_img=default_item_img;
        }
        else
        {
          product_img = img_path + product.img;
          product_img = checkFileExists(product_img)
          ? product_img
          : default_item_img;
        }
        
        //render product list
        product_list +=
          `<tr>
            <td><img id="` +
          product._id +
          `"></td>
            <td><img style="max-height: 50px; max-width: 50px; border: 1px solid #ddd;" src="${product_img}" id="product_img"></td>
            <td>${product.name}
            ${product.expiryAlert}</td>
            <td>${validator.unescape(settings.symbol)}${product.price}</td>
            <td>${product.stock == 1 ? product.quantity : "N/A"}
            ${product.stockAlert}
            </td>
            <td>${product.expirationDate}</td>
            <td>${category.length > 0 ? category[0].name : ""}</td>
            <td class="nobr"><span class="btn-group"><button onClick="$(this).editProduct(${index})" class="btn btn-warning btn-sm"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteProduct(${
              product._id
            })" class="btn btn-danger btn-sm"><i class="fa fa-trash"></i></button></span></td></tr>`;

        if (counter == allProducts.length) {
          $("#product_list").html(product_list);

          products.forEach((product) => {
            let bcode = product.barcode || product._id;
            $("#" + product._id + "").JsBarcode(bcode, {
              width: 2,
              height: 25,
              fontSize: 14,
            });
          });
        }
      });

      $("#productList").DataTable({
        order: [[1, "desc"]],
        autoWidth: false,
        info: true,
        JQueryUI: true,
        ordering: true,
        paging: false,
        dom: "Bfrtip",
        buttons: [
          {
            extend: "pdfHtml5",
            className: "btn btn-light", // Custom class name
            text: " Download PDF", // Custom text
            filename: "product_list.pdf", // Default filename
          },
        ],
      });
    }

    function loadCategoryList() {
      let category_list = "";
      let counter = 0;
      $("#category_list").empty();
      $("#categoryList").DataTable().destroy();

      allCategories.forEach((category, index) => {
        counter++;

        category_list += `<tr>
     
            <td>${category.name}</td>
            <td><span class="btn-group"><button onClick="$(this).editCategory(${index})" class="btn btn-warning"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteCategory(${category._id})" class="btn btn-danger"><i class="fa fa-trash"></i></button></span></td></tr>`;
      });

      if (counter == allCategories.length) {
        $("#category_list").html(category_list);
        $("#categoryList").DataTable({
          autoWidth: false,
          info: true,
          JQueryUI: true,
          ordering: true,
          paging: false,
        });
      }
    }


    $("#log-out").on("click", function () {
      const diagOptions = {
        title: "Are you sure?",
        text: "You are about to log out.",
        cancelButtonColor: "#3085d6",
        okButtonText: "Logout",
      };

      notiflix.Confirm.show(
        diagOptions.title,
        diagOptions.text,
        diagOptions.okButtonText,
        diagOptions.cancelButtonText,
        () => {
          $.get(api + "users/logout/" + user._id, function (data) {
            storage.delete("auth");
            storage.delete("user");
            ipcRenderer.send("app-reload", "");
          });
        },
      );
    });

    $("#settings_form").on("submit", function (e) {
      e.preventDefault();
      let formData = $(this).serializeObject();
      let mac_address;

      api = "http://" + host + ":" + port + "/api/";

      macaddress.one(function (err, mac) {
        mac_address = mac;
      });
      const appChoice = $("#app").find("option:selected").text();
    
      formData["app"] = appChoice;
      formData["mac"] = mac_address;
      formData["till"] = 1;

      // Update application field in settings form
      let $appField = $("#settings_form input[name='app']");
      let $hiddenAppField = $('<input>', {
        type: 'hidden',
        name: 'app',
        value: formData.app
    });
        $appField.length 
            ? $appField.val(formData.app) 
            : $("#settings_form").append(`<input type="hidden" name="app" value="${$hiddenAppField}" />`);


      if (formData.percentage != "" && typeof formData.percentage === 'number') {
        notiflix.Report.warning(
          "Oops!",
          "Please make sure the tax value is a number",
          "Ok",
        );
      } else {
        storage.set("settings", formData);

        $(this).attr("action", api + "settings/post");
        $(this).attr("method", "POST");

        $(this).ajaxSubmit({
          contentType: "application/json",
          success: function () {
            ipcRenderer.send("app-reload", "");
          },
          error: function (jqXHR) {
            console.error(jqXHR.responseJSON.message);
            notiflix.Report.failure(
              jqXHR.responseJSON.error,
              jqXHR.responseJSON.message,
              "Ok",
            );
      }
    });
    }
  });

  // ============================================
  // Clear All Data Functionality
  // ============================================
  
  // Open confirmation modal
  $("#clearAllDataBtn").on("click", function() {
    $("#clearDataConfirmInput").val("");
    $("#confirmClearDataBtn").prop("disabled", true);
    $("#settingsModal").modal("hide");
    setTimeout(function() {
      $("#clearDataModal").modal("show");
    }, 300);
  });
  
  // Enable/disable confirm button based on input
  $("#clearDataConfirmInput").on("input", function() {
    const value = $(this).val().trim().toUpperCase();
    $("#confirmClearDataBtn").prop("disabled", value !== "DELETE");
  });
  
  // Perform the clear operation
  $("#confirmClearDataBtn").on("click", function() {
    const $btn = $(this);
    const originalText = $btn.html();
    
    $btn.prop("disabled", true);
    $btn.html('<i class="fa fa-spinner fa-spin"></i> Clearing...');
    
    $.ajax({
      url: api + "settings/clear-all-data",
      method: "DELETE",
      success: function(response) {
        $("#clearDataModal").modal("hide");
        
        notiflix.Report.success(
          "Data Cleared",
          "All data has been cleared successfully. The application will now restart.",
          "Restart Now",
          function() {
            ipcRenderer.send("app-reload", "");
          }
        );
      },
      error: function(jqXHR) {
        $btn.prop("disabled", false);
        $btn.html(originalText);
        
        notiflix.Report.failure(
          "Error",
          jqXHR.responseJSON ? jqXHR.responseJSON.message : "Failed to clear data. Please try again.",
          "Ok"
        );
      }
    });
  });
  
  // Reset modal state when closed
  $("#clearDataModal").on("hidden.bs.modal", function() {
    $("#clearDataConfirmInput").val("");
    $("#confirmClearDataBtn").prop("disabled", true);
  });

    $("#net_settings_form").on("submit", function (e) {
      e.preventDefault();
      let formData = $(this).serializeObject();

      if (formData.till == 0 || formData.till == 1) {
        notiflix.Report.warning(
          "Oops!",
          "Please enter a number greater than 1.",
          "Ok",
        );
      } else {
        if (isNumeric(formData.till)) {
          formData["app"] = $("#app").find("option:selected").text();
          storage.set("settings", formData);
          ipcRenderer.send("app-reload", "");
        } else {
          notiflix.Report.warning(
            "Oops!",
            "Till number must be a number!",
            "Ok",
          );
        }
      }
    });

    $("#saveUser").on("submit", function (e) {
      e.preventDefault();
      let formData = $(this).serializeObject();

      if (formData.password != formData.pass) {
        notiflix.Report.warning("Oops!", "Passwords do not match!", "Ok");
      }

      if (
        bcrypt.compare(formData.password, user.password) ||
        bcrypt.compare(formData.password, allUsers[user_index].password)
      ) {
        $.ajax({
          url: api + "users/post",
          type: "POST",
          data: JSON.stringify(formData),
          contentType: "application/json; charset=utf-8",
          cache: false,
          processData: false,
          success: function (data) {
            if (ownUserEdit) {
              ipcRenderer.send("app-reload", "");
            } else {
              $("#userModal").modal("hide");

              loadUserList();

              $("#Users").modal("show");
              notiflix.Report.success("Great!", "User details saved!", "Ok");
            }
          },
          error: function (jqXHR,textStatus, errorThrown) {
            notiflix.Report.failure(
              jqXHR.responseJSON.error,
              jqXHR.responseJSON.message,
              "Ok",
            );
          },
        });
      }
    });

    $("#app").on("change", function () {
      if (
        $(this).find("option:selected").text() ==
        "Network Point of Sale Terminal"
      ) {
        $("#net_settings_form").show(500);
        $("#settings_form").hide(500);
        macaddress.one(function (err, mac) {
          $("#mac").val(mac);
        });
      } else {
        $("#net_settings_form").hide(500);
        $("#settings_form").show(500);
      }
    });

    $("#cashier").on("click", function () {
      ownUserEdit = true;

      $("#userModal").modal("show");

      $("#user_id").val(user._id);
      $("#fullname").val(user.fullname);
      $("#username").val(user.username);
      $("#password").attr("placeholder", "New Password");

      for (perm of permissions) {
        var el = "#" + perm;
        if (allUsers[index][perm] == 1) {
          $(el).prop("checked", true);
        } else {
          $(el).prop("checked", false);
        }
      }
    });

    $("#add-user").on("click", function () {
      if (platform.app != "Network Point of Sale Terminal") {
        $(".perms").show();
      }

      $("#saveUser").get(0).reset();
      $("#userModal").modal("show");
    });

    $("#settings").on("click", function () {
      if (platform.app == "Network Point of Sale Terminal") {
        $("#net_settings_form").show(500);
        $("#settings_form").hide(500);

        $("#ip").val(platform.ip);
        $("#till").val(platform.till);

        macaddress.one(function (err, mac) {
          $("#mac").val(mac);
        });

        $("#app option")
          .filter(function () {
            return $(this).text() == platform.app;
          })
          .prop("selected", true);
      } else {
        $("#net_settings_form").hide(500);
        $("#settings_form").show(500);

        $("#settings_id").val("1");
        $("#store").val(validator.unescape(settings.store));
        $("#address_one").val(validator.unescape(settings.address_one));
        $("#address_two").val(validator.unescape(settings.address_two));
        $("#contact").val(validator.unescape(settings.contact));
        $("#tax").val(validator.unescape(settings.tax));
        $("#symbol").val(validator.unescape(settings.symbol));
        $("#percentage").val(validator.unescape(settings.percentage));
        $("#footer").val(validator.unescape(settings.footer));
        $("#logo_img").val(validator.unescape(settings.img));
        if (settings.charge_tax) {
          $("#charge_tax").prop("checked", true);
        }
        if (validator.unescape(settings.img) != "") {
          $("#logoname").hide();
          $("#current_logo").html(
            `<img src="${img_path + validator.unescape(settings.img)}" alt="">`,
          );
          $("#rmv_logo").show();
        }

        $("#app option")
          .filter(function () {
            return $(this).text() == validator.unescape(settings.app);
          })
          .prop("selected", true);
      }
    });
 });

  $("#rmv_logo").on("click", function () {
    $("#remove_logo").val("1");
    // $("#logo_img").val('');
    $("#current_logo").hide(500);
    $(this).hide(500);
    $("#logoname").show(500);
  });

  $("#rmv_img").on("click", function () {
    $("#remove_img").val("1");
    // $("#img").val('');
    $("#current_img").hide(500);
    $(this).hide(500);
    $("#imagename").show(500);
  });
}

$.fn.print = function () {
  printJS({ printable: receipt, type: "raw-html" });
};

function loadTransactions() {
  let tills = [];
  let users = [];
  let sales = 0;
  let transact = 0;
  let unique = 0;

  sold_items = [];
  sold = [];

  let counter = 0;
  let transaction_list = "";
  let query = `by-date?start=${start_date}&end=${end_date}&user=${by_user}&status=${by_status}&till=${by_till}`;

  $.get(api + query, function (transactions) {
    if (transactions.length > 0) {
      $("#transaction_list").empty();
      $("#transactionList").DataTable().destroy();

      allTransactions = [...transactions];

      transactions.forEach((trans, index) => {
        sales += parseFloat(trans.total);
        transact++;

        trans.items.forEach((item) => {
          sold_items.push(item);
        });

        if (!tills.includes(trans.till)) {
          tills.push(trans.till);
        }

        if (!users.includes(trans.user_id)) {
          users.push(trans.user_id);
        }

        counter++;
        transaction_list += `<tr>
                                <td>${trans.order}</td>
                                <td class="nobr">${moment(trans.date).format(
                                  "DD-MMM-YYYY HH:mm:ss",
                                )}</td>
                                <td>${
                                  validator.unescape(settings.symbol) + moneyFormat(trans.total)
                                }</td>
                                <td>${
                                  trans.paid == ""
                                    ? ""
                                    : validator.unescape(settings.symbol) + moneyFormat(trans.paid)
                                }</td>
                                <td>${
                                  trans.change
                                    ? validator.unescape(settings.symbol) +
                                      moneyFormat(
                                        Math.abs(trans.change).toFixed(2),
                                      )
                                    : ""
                                }</td>
                                <td>${
                                  trans.paid == ""
                                    ? ""
                                    : trans.payment_type
                                }</td>
                                <td>${trans.till}</td>
                                <td>${trans.user}</td>
                                <td>${
                                  trans.paid == ""
                                    ? '<button class="btn btn-dark"><i class="fa fa-search-plus"></i></button>'
                                    : '<button onClick="$(this).viewTransaction(' +
                                      index +
                                      ')" class="btn btn-info"><i class="fa fa-search-plus"></i></button></td>'
                                }</tr>
                    `;

        if (counter == transactions.length) {
          $("#total_sales #counter").text(
            validator.unescape(settings.symbol) + moneyFormat(parseFloat(sales).toFixed(2)),
          );
          $("#total_transactions #counter").text(transact);

          const result = {};

          for (const { product_name, price, quantity, id } of sold_items) {
            if (!result[product_name]) result[product_name] = [];
            result[product_name].push({ id, price, quantity });
          }

          for (item in result) {
            let price = 0;
            let quantity = 0;
            let id = 0;

            result[item].forEach((i) => {
              id = i.id;
              price = i.price;
              quantity = quantity + parseInt(i.quantity);
            });

            sold.push({
              id: id,
              product: item,
              qty: quantity,
              price: price,
            });
          }

          loadSoldProducts();

          if (by_user == 0 && by_till == 0) {
            userFilter(users);
            tillFilter(tills);
          }

          $("#transaction_list").html(transaction_list);
          $("#transactionList").DataTable({
            order: [[1, "desc"]],
            autoWidth: false,
            info: true,
            JQueryUI: true,
            ordering: true,
            paging: true,
            dom: "Bfrtip",
            buttons: ["csv", "excel", "pdf"],
          });
        }
      });
    } else {
      notiflix.Report.warning(
        "No data!",
        "No transactions available within the selected criteria",
        "Ok",
      );
    }
  });
}

function sortDesc(a, b) {
  if (a.qty > b.qty) {
    return -1;
  }
  if (a.qty < b.qty) {
    return 1;
  }
  return 0;
}

function loadSoldProducts() {
  sold.sort(sortDesc);

  let counter = 0;
  let sold_list = "";
  let items = 0;
  let products = 0;
  $("#product_sales").empty();

  sold.forEach((item, index) => {
    items = items + parseInt(item.qty);
    products++;

    let product = allProducts.filter(function (selected) {
      return selected._id == item.id;
    });

    counter++;

    sold_list += `<tr>
            <td>${item.product}</td>
            <td>${item.qty}</td>
            <td>${
              product[0].stock == 1
                ? product.length > 0
                  ? product[0].quantity
                  : ""
                : "N/A"
            }</td>
            <td>${
              validator.unescape(settings.symbol) +
              moneyFormat((item.qty * parseFloat(item.price)).toFixed(2))
            }</td>
            </tr>`;

    if (counter == sold.length) {
      $("#total_items #counter").text(items);
      $("#total_products #counter").text(products);
      $("#product_sales").html(sold_list);
    }
  });
}

function userFilter(users) {
  $("#users").empty();
  $("#users").append(`<option value="0">All</option>`);

  users.forEach((user) => {
    let u = allUsers.filter(function (usr) {
      return usr._id == user;
    });

    $("#users").append(`<option value="${user}">${u[0].fullname}</option>`);
  });
}

function tillFilter(tills) {
  $("#tills").empty();
  $("#tills").append(`<option value="0">All</option>`);
  tills.forEach((till) => {
    $("#tills").append(`<option value="${till}">${till}</option>`);
  });
}

$.fn.viewTransaction = function (index) {
  transaction_index = index;

  let discount = allTransactions[index].discount;
  let customer =
    allTransactions[index].customer == 0
      ? "Walk in Customer"
      : allTransactions[index].customer.username;
  let refNumber =
    allTransactions[index].ref_number != ""
      ? allTransactions[index].ref_number
      : allTransactions[index].order;
  let orderNumber = allTransactions[index].order;
  let paymentMethod = "";
  let tax_row = "";
  let items = "";
  let products = allTransactions[index].items;

  products.forEach((item) => {
    items += `<tr><td>${item.product_name}</td><td>${
      item.quantity
    } </td><td class="text-right"> ${validator.unescape(settings.symbol)} ${moneyFormat(
      Math.abs(item.price).toFixed(2),
    )} </td></tr>`;
  });

  paymentMethod = allTransactions[index].payment_type;
 

  if (allTransactions[index].paid != "") {
    payment = `<tr>
                    <td>Paid</td>
                    <td>:</td>
                    <td class="text-right">${validator.unescape(settings.symbol)} ${moneyFormat(
                      Math.abs(allTransactions[index].paid).toFixed(2),
                    )}</td>
                </tr>
                <tr>
                    <td>Change</td>
                    <td>:</td>
                    <td class="text-right">${validator.unescape(settings.symbol)} ${moneyFormat(
                      Math.abs(allTransactions[index].change).toFixed(2),
                    )}</td>
                </tr>
                <tr>
                    <td>Method</td>
                    <td>:</td>
                    <td class="text-right">${paymentMethod}</td>
                </tr>`;
  }

  if (settings.charge_tax) {
    tax_row = `<tr>
                <td>Vat(${validator.unescape(settings.percentage)})% </td>
                <td>:</td>
                <td class="text-right">${validator.unescape(settings.symbol)}${parseFloat(
                  allTransactions[index].tax,
                ).toFixed(2)}</td>
            </tr>`;
  }

    logo = path.join(img_path, validator.unescape(settings.img));
      
      receipt = `<div style="font-size: 10px">                            
        <p style="text-align: center;">
        ${
          checkFileExists(logo)
            ? `<img style='max-width: 50px' src='${logo}' /><br>`
            : ``
        }
            <span style="font-size: 22px;">${validator.unescape(settings.store)}</span> <br>
            ${validator.unescape(settings.address_one)} <br>
            ${validator.unescape(settings.address_two)} <br>
            ${
              validator.unescape(settings.contact) != "" ? "Tel: " + validator.unescape(settings.contact) + "<br>" : ""
            } 
            ${validator.unescape(settings.tax) != "" ? "Vat No: " + validator.unescape(settings.tax) + "<br>" : ""} 
    </p>
    <hr>
    <left>
        <p>
        Invoice : ${orderNumber} <br>
        Ref No : ${refNumber} <br>
        Customer : ${
          allTransactions[index].customer == 0
            ? "Walk in Customer"
            : allTransactions[index].customer.name
        } <br>
        Cashier : ${allTransactions[index].user} <br>
        Date : ${moment(allTransactions[index].date).format(
          "DD MMM YYYY HH:mm:ss",
        )}<br>
        </p>

    </left>
    <hr>
    <table width="90%">
        <thead>
        <tr>
            <th>Item</th>
            <th>Qty</th>
            <th class="text-right">Price</th>
        </tr>
        </thead>
        <tbody>
        ${items}                
        <tr><td colspan="3"><hr></td></tr>
        <tr>                        
            <td><b>Subtotal</b></td>
            <td>:</td>
            <td class="text-right"><b>${validator.unescape(settings.symbol)}${moneyFormat(
              allTransactions[index].subtotal,
            )}</b></td>
        </tr>
        <tr>
            <td>Discount</td>
            <td>:</td>
            <td class="text-right">${
              discount > 0
                ? validator.unescape(settings.symbol) +
                  moneyFormat(
                    parseFloat(allTransactions[index].discount).toFixed(2),
                  )
                : ""
            }</td>
        </tr>
        
        ${tax_row}
    
        <tr>
            <td><h5>Total</h5></td>
            <td><h5>:</h5></td>
            <td class="text-right">
                <h5>${validator.unescape(settings.symbol)}${moneyFormat(
                  allTransactions[index].total,
                )}</h5>
            </td>
        </tr>
        ${payment == 0 ? "" : payment}
        </tbody>
        </table>
        <br>
        <hr>
        <br>
        <p style="text-align: center;">
         ${validator.unescape(settings.footer)}
         </p>
        </div>`;

        //prevent DOM XSS; allow windows paths in img src
        receipt = DOMPurify.sanitize(receipt,{ ALLOW_UNKNOWN_PROTOCOLS: true });

  $("#viewTransaction").html("");
  $("#viewTransaction").html(receipt);

  $("#orderModal").modal("show");
};

$("#status").on("change", function () {
  by_status = $(this).find("option:selected").val();
  loadTransactions();
});

$("#tills").on("change", function () {
  by_till = $(this).find("option:selected").val();
  loadTransactions();
});

$("#users").on("change", function () {
  by_user = $(this).find("option:selected").val();
  loadTransactions();
});

$("#reportrange").on("apply.daterangepicker", function (ev, picker) {
  start = picker.startDate.format("DD MMM YYYY hh:mm A");
  end = picker.endDate.format("DD MMM YYYY hh:mm A");

  start_date = picker.startDate.toDate().toJSON();
  end_date = picker.endDate.toDate().toJSON();

  loadTransactions();
});

function authenticate() {
  $(".loading").hide();
  $("body").attr("class", "login-page");
  $("#login").show();
}

$("body").on("submit", "#account", function (e) {
  e.preventDefault();
  let formData = $(this).serializeObject();

  if (formData.username == "" || formData.password == "") {
    notiflix.Report.warning("Incomplete form!", auth_empty, "Ok");
  } else {
    $.ajax({
      url: api + "users/login",
      type: "POST",
      data: JSON.stringify(formData),
      contentType: "application/json; charset=utf-8",
      cache: false,
      processData: false,
      success: function (data) {
        if (data.auth === true) {
          storage.set("auth", { auth: true });
          storage.set("user", data);
          ipcRenderer.send("app-reload", "");
          $("#login").hide();
        } else {
          notiflix.Report.warning("Oops!", auth_error, "Ok");
        }
      },
      error: function (data) {
        console.log(data);
      },
    });
  }
});

$("#quit").on("click", function () {
  const diagOptions = {
    title: "Are you sure?",
    text: "You are about to close the application.",
    icon: "warning",
    okButtonText: "Close Application",
    cancelButtonText: "Cancel"
  };

  notiflix.Confirm.show(
    diagOptions.title,
    diagOptions.text,
    diagOptions.okButtonText,
    diagOptions.cancelButtonText,
    () => {
      ipcRenderer.send("app-quit", "");
    },
  );
});

ipcRenderer.on("click-element", (event, elementId) => {
  document.getElementById(elementId).click();
});

// ============================================
// INVENTORY MANAGEMENT
// ============================================

let allSuppliers = [];

// Load inventory view
$("#inventoryBtn").on("click", function () {
  $("#pos_view").hide();
  $("#transactions_view").hide();
  $("#inventory_view").show();
  updateStatusBarPage("Inventory Management", "glyphicon-list-alt");
  loadInventoryData();
  loadSuppliers();
});

// Back to POS from inventory
$("#pointofsale, #backToPosBtn").on("click", function () {
  $("#inventory_view").hide();
  $("#transactions_view").hide();
  $("#pos_view").show();
  updateStatusBarPage("Point of Sale", "glyphicon-shopping-cart");
});

$("#transactions").on("click", function () {
  $("#inventory_view").hide();
  $("#pos_view").hide();
  $("#transactions_view").show();
  updateStatusBarPage("Transactions", "glyphicon-credit-card");
});

// Update status bar with current page
function updateStatusBarPage(pageName, iconClass) {
  $("#status-page-name").text(pageName);
  $("#status-page-icon").attr("class", "glyphicon " + iconClass);
}

// Load inventory data
function loadInventoryData() {
  $.get(api + "inventory/products", function (data) {
    let totalProducts = data.length;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    data.forEach(product => {
      if (product.stock == 1) {
        if (product.quantity <= 0) {
          outOfStock++;
        } else if (product.quantity <= (product.minStock || 10)) {
          lowStock++;
        } else {
          inStock++;
        }
      } else {
        inStock++; // Non-tracked stock counts as in-stock
      }
    });

    // Update stats
    $("#inv-total-products").text(totalProducts);
    $("#inv-in-stock").text(inStock);
    $("#inv-low-stock").text(lowStock);
    $("#inv-out-stock").text(outOfStock);

    // Populate category filter
    let categories = [...new Set(data.map(p => p.category).filter(c => c))];
    let categoryFilter = $("#inv-category-filter");
    categoryFilter.html('<option value="">All Categories</option>');
    
    allCategories.forEach(cat => {
      categoryFilter.append(`<option value="${cat._id}">${cat.name}</option>`);
    });

    // Render inventory table
    renderInventoryTable(data);
  });
}

// Render inventory table
function renderInventoryTable(products) {
  let tbody = $("#inventory-list");
  tbody.empty();

  if (products.length === 0) {
    tbody.html('<tr><td colspan="13" class="text-center">No products found</td></tr>');
    return;
  }

  products.forEach(product => {
    let stockStatus = getInventoryStockStatus(product);
    let expiryStatus = getExpiryStatus(product.expirationDate);
    let productImg = product.img ? path.join(img_path, product.img) : default_item_img;
    productImg = checkFileExists(productImg) ? productImg : default_item_img;
    
    let supplierName = "";
    if (product.supplier_id && allSuppliers.length > 0) {
      let supplier = allSuppliers.find(s => s._id === product.supplier_id);
      supplierName = supplier ? supplier.name : "";
    }

    let row = `
      <tr>
        <td>${product._id}</td>
        <td><img src="${productImg}" alt="${product.name}"></td>
        <td>${validator.unescape(product.name || "")}</td>
        <td>${product.barcode || product._id}</td>
        <td>${getCategoryName(product.category)}</td>
        <td>${supplierName}</td>
        <td>${settings ? validator.unescape(settings.symbol) : ""}${moneyFormat(product.costPrice || 0)}</td>
        <td>${settings ? validator.unescape(settings.symbol) : ""}${moneyFormat(product.price)}</td>
        <td>${product.stock == 1 ? product.quantity : "N/A"}</td>
        <td>${product.minStock || "-"}</td>
        <td><span class="stock-badge ${stockStatus.class}">${stockStatus.text}</span></td>
        <td><span class="${expiryStatus.class}">${product.expirationDate || "-"}</span></td>
        <td>
          <button class="btn btn-xs btn-info edit-product-btn" data-id="${product._id}" title="Edit">
            <i class="fa fa-pencil"></i>
          </button>
          <button class="btn btn-xs btn-danger delete-product-btn" data-id="${product._id}" title="Delete">
            <i class="fa fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
    tbody.append(row);
  });
}

// Get inventory stock status
function getInventoryStockStatus(product) {
  if (product.stock != 1) {
    return { text: "N/A", class: "" };
  }
  if (product.quantity <= 0) {
    return { text: "Out of Stock", class: "stock-out" };
  }
  if (product.quantity <= (product.minStock || 10)) {
    return { text: "Low Stock", class: "stock-low" };
  }
  return { text: "In Stock", class: "stock-in" };
}

// Get expiry status
function getExpiryStatus(expirationDate) {
  if (!expirationDate) {
    return { class: "" };
  }
  if (isExpired(expirationDate)) {
    return { class: "expired-badge" };
  }
  let days = daysToExpire(moment(expirationDate, DATE_FORMAT));
  if (days <= 30) {
    return { class: "text-warning" };
  }
  return { class: "" };
}

// Get category name by ID
function getCategoryName(categoryId) {
  if (!categoryId) return "-";
  let category = allCategories.find(c => c._id == categoryId);
  return category ? category.name : "-";
}

// Inventory filters
$("#inv-search, #inv-category-filter, #inv-stock-filter, #inv-supplier-filter").on("change keyup", function () {
  filterInventory();
});

function filterInventory() {
  let searchTerm = $("#inv-search").val().toLowerCase();
  let categoryFilter = $("#inv-category-filter").val();
  let stockFilter = $("#inv-stock-filter").val();
  let supplierFilter = $("#inv-supplier-filter").val();

  $.get(api + "inventory/products", function (data) {
    let filtered = data.filter(product => {
      // Search filter
      let matchesSearch = !searchTerm || 
        (product.name && product.name.toLowerCase().includes(searchTerm)) ||
        (product.barcode && product.barcode.toLowerCase().includes(searchTerm));

      // Category filter
      let matchesCategory = !categoryFilter || product.category == categoryFilter;

      // Stock filter
      let matchesStock = true;
      if (stockFilter) {
        let status = getInventoryStockStatus(product);
        if (stockFilter === "in-stock") matchesStock = status.class === "stock-in";
        else if (stockFilter === "low-stock") matchesStock = status.class === "stock-low";
        else if (stockFilter === "out-of-stock") matchesStock = status.class === "stock-out";
      }

      // Supplier filter
      let matchesSupplier = !supplierFilter || product.supplier_id == supplierFilter;

      return matchesSearch && matchesCategory && matchesStock && matchesSupplier;
    });

    renderInventoryTable(filtered);
  });
}

// Refresh inventory
$("#refreshInventory").on("click", function () {
  loadInventoryData();
  notiflix.Notify.success("Inventory refreshed!");
});

// Export inventory (Professional Excel with styling)
$("#exportInventory").on("click", function () {
  $.get(api + "inventory/products", function (data) {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'PharmaSpot';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('Inventory', {
      properties: { tabColor: { argb: '1a365d' } },
      views: [{ state: 'frozen', ySplit: 3 }]
    });
    
    // Add company header
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = (settings.store || 'PharmaSpot') + ' - Inventory Report';
    titleCell.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1a365d' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 35;
    
    // Add date row
    worksheet.mergeCells('A2:I2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = 'Generated: ' + moment().format('MMMM DD, YYYY [at] HH:mm');
    dateCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: '666666' } };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 20;
    
    // Define columns with headers
    worksheet.getRow(3).values = ['#', 'Product Name', 'Barcode', 'Category', 'Cost Price', 'Sell Price', 'Quantity', 'Min Stock', 'Expiry Date'];
    
    // Style header row
    const headerRow = worksheet.getRow(3);
    headerRow.height = 25;
    headerRow.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2c5282' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: '1a365d' } },
        bottom: { style: 'thin', color: { argb: '1a365d' } },
        left: { style: 'thin', color: { argb: '1a365d' } },
        right: { style: 'thin', color: { argb: '1a365d' } }
      };
    });
    
    // Set column widths
    worksheet.columns = [
      { width: 6 },   // #
      { width: 30 },  // Product Name
      { width: 15 },  // Barcode
      { width: 18 },  // Category
      { width: 12 },  // Cost Price
      { width: 12 },  // Sell Price
      { width: 10 },  // Quantity
      { width: 10 },  // Min Stock
      { width: 14 }   // Expiry Date
    ];
    
    // Add data rows
    let rowIndex = 4;
    let totalProducts = 0;
    let totalQuantity = 0;
    let lowStockCount = 0;
    let expiredCount = 0;
    
    data.forEach((p, index) => {
      totalProducts++;
      totalQuantity += parseInt(p.quantity) || 0;
      
      const isLowStock = (p.quantity || 0) <= (p.minStock || 10);
      const isExpired = moment(p.expirationDate, 'DD-MMM-YY').isBefore(moment());
      const isExpiringSoon = !isExpired && moment(p.expirationDate, 'DD-MMM-YY').diff(moment(), 'days') <= 30;
      
      if (isLowStock) lowStockCount++;
      if (isExpired) expiredCount++;
      
      const row = worksheet.addRow([
        index + 1,
        validator.unescape(p.name),
        p.barcode || '-',
        getCategoryName(p.category),
        p.costPrice || 0,
        p.price || 0,
        p.quantity || 0,
        p.minStock || '-',
        p.expirationDate || '-'
      ]);
      
      // Alternate row colors
      const bgColor = index % 2 === 0 ? 'F7FAFC' : 'FFFFFF';
      
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: colNumber <= 2 ? 'center' : (colNumber >= 5 && colNumber <= 8 ? 'right' : 'left') };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } }
        };
        
        // Highlight low stock in orange
        if (colNumber === 7 && isLowStock && !isExpired) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FED7AA' } };
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'C05621' } };
        }
        
        // Highlight expired in red
        if (isExpired && colNumber === 9) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FED7D7' } };
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'C53030' } };
        }
        
        // Highlight expiring soon in yellow
        if (isExpiringSoon && colNumber === 9) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEFCBF' } };
          cell.font = { name: 'Arial', size: 10, color: { argb: '744210' } };
        }
      });
      
      // Format currency columns
      row.getCell(5).numFmt = '#,##0.00';
      row.getCell(6).numFmt = '#,##0.00';
      
      rowIndex++;
    });
    
    // Add summary section
    rowIndex++;
    worksheet.mergeCells(`A${rowIndex}:I${rowIndex}`);
    worksheet.getCell(`A${rowIndex}`).value = '';
    rowIndex++;
    
    // Summary header
    worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
    const summaryHeader = worksheet.getCell(`A${rowIndex}`);
    summaryHeader.value = 'INVENTORY SUMMARY';
    summaryHeader.font = { name: 'Arial', size: 12, bold: true, color: { argb: '1a365d' } };
    summaryHeader.alignment = { horizontal: 'left' };
    rowIndex++;
    
    // Summary data
    const summaryData = [
      ['Total Products:', totalProducts],
      ['Total Quantity:', totalQuantity],
      ['Low Stock Items:', lowStockCount],
      ['Expired Items:', expiredCount]
    ];
    
    summaryData.forEach(([label, value]) => {
      worksheet.getCell(`A${rowIndex}`).value = label;
      worksheet.getCell(`A${rowIndex}`).font = { name: 'Arial', size: 10, bold: true };
      worksheet.getCell(`B${rowIndex}`).value = value;
      worksheet.getCell(`B${rowIndex}`).font = { name: 'Arial', size: 10 };
      if (label.includes('Low Stock')) {
        worksheet.getCell(`B${rowIndex}`).font = { name: 'Arial', size: 10, color: { argb: 'C05621' } };
      }
      if (label.includes('Expired')) {
        worksheet.getCell(`B${rowIndex}`).font = { name: 'Arial', size: 10, color: { argb: 'C53030' } };
      }
      rowIndex++;
    });
    
    // Add legend
    rowIndex++;
    worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
    worksheet.getCell(`A${rowIndex}`).value = 'Legend:';
    worksheet.getCell(`A${rowIndex}`).font = { name: 'Arial', size: 9, bold: true };
    rowIndex++;
    
    const legendCell1 = worksheet.getCell(`A${rowIndex}`);
    legendCell1.value = '  ● Low Stock';
    legendCell1.font = { name: 'Arial', size: 9, color: { argb: 'C05621' } };
    rowIndex++;
    
    const legendCell2 = worksheet.getCell(`A${rowIndex}`);
    legendCell2.value = '  ● Expired';
    legendCell2.font = { name: 'Arial', size: 9, color: { argb: 'C53030' } };
    rowIndex++;
    
    const legendCell3 = worksheet.getCell(`A${rowIndex}`);
    legendCell3.value = '  ● Expiring Soon (≤30 days)';
    legendCell3.font = { name: 'Arial', size: 9, color: { argb: '744210' } };
    
    // Generate and save file
    const filename = `PharmaSpot_Inventory_${moment().format("YYYY-MM-DD_HHmm")}.xlsx`;
    const filePath = path.join(require('os').homedir(), 'Downloads', filename);
    
    workbook.xlsx.writeFile(filePath).then(() => {
      notiflix.Report.success(
        "Export Complete",
        `Inventory exported successfully to:\n${filePath}`,
        "Open Folder",
        function() {
          require('electron').shell.showItemInFolder(filePath);
        }
      );
    }).catch(err => {
      console.error("Export error:", err);
      notiflix.Report.failure("Export Failed", "Could not export inventory. Please try again.", "Ok");
    });
  });
});

// Edit product from inventory
$(document).on("click", ".edit-product-btn", function () {
  let productId = $(this).data("id");
  $.get(api + "inventory/product/" + productId, function (product) {
    $("#newProduct").modal("show");
    // Populate form - this uses existing product modal
    $("#productId").val(product._id);
    $("#name").val(validator.unescape(product.name));
    $("#description").val(validator.unescape(product.description || ""));
    $("#barcode").val(product.barcode);
    $("#category").val(product.category);
    $("#costPrice").val(product.costPrice || "");
    $("#sell_price").val(product.price);
    $("#quantity").val(product.quantity);
    $("#minStock").val(product.minStock || "");
    $("#expirationDate").val(product.expirationDate);
    if (product.stock == 1) {
      $("#stock").prop("checked", true);
    }
  });
});

// ============================================
// SUPPLIERS MANAGEMENT
// ============================================

// Load suppliers
function loadSuppliers() {
  $.get(api + "suppliers/all", function (data) {
    allSuppliers = data;
    renderSuppliersTable(data);
    
    // Update supplier filter in inventory
    let supplierFilter = $("#inv-supplier-filter");
    supplierFilter.html('<option value="">All Suppliers</option>');
    data.forEach(supplier => {
      supplierFilter.append(`<option value="${supplier._id}">${supplier.name}</option>`);
    });
  }).fail(function() {
    allSuppliers = [];
  });
}

// Render suppliers table
function renderSuppliersTable(suppliers) {
  let tbody = $("#suppliers-list");
  tbody.empty();

  if (suppliers.length === 0) {
    tbody.html('<tr><td colspan="7" class="text-center">No suppliers found. Click "Add Supplier" to add one.</td></tr>');
    return;
  }

  suppliers.forEach(supplier => {
    let row = `
      <tr>
        <td>${supplier._id}</td>
        <td>${validator.unescape(supplier.name)}</td>
        <td>${validator.unescape(supplier.contact_person || "-")}</td>
        <td>${validator.unescape(supplier.email || "-")}</td>
        <td>${validator.unescape(supplier.phone || "-")}</td>
        <td>${validator.unescape(supplier.address || "-")}</td>
        <td>
          <button class="btn btn-xs btn-info edit-supplier-btn" data-id="${supplier._id}" title="Edit">
            <i class="fa fa-pencil"></i>
          </button>
          <button class="btn btn-xs btn-danger delete-supplier-btn" data-id="${supplier._id}" data-name="${supplier.name}" title="Delete">
            <i class="fa fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
    tbody.append(row);
  });
}

// Add supplier button
$("#addSupplierBtn").on("click", function () {
  $("#supplierForm").get(0).reset();
  $("#supplier_id").val("");
  $("#supplierFormModalLabel").html('<i class="glyphicon glyphicon-briefcase"></i> Add Supplier');
  $("#supplierFormModal").modal("show");
});

// Edit supplier
$(document).on("click", ".edit-supplier-btn", function () {
  let supplierId = $(this).data("id");
  $.get(api + "suppliers/supplier/" + supplierId, function (supplier) {
    $("#supplier_id").val(supplier._id);
    $("#supplier_name").val(validator.unescape(supplier.name));
    $("#supplier_contact_person").val(validator.unescape(supplier.contact_person || ""));
    $("#supplier_email").val(validator.unescape(supplier.email || ""));
    $("#supplier_phone").val(validator.unescape(supplier.phone || ""));
    $("#supplier_address").val(validator.unescape(supplier.address || ""));
    $("#supplier_notes").val(validator.unescape(supplier.notes || ""));
    $("#supplierFormModalLabel").html('<i class="glyphicon glyphicon-briefcase"></i> Edit Supplier');
    $("#supplierFormModal").modal("show");
  });
});

// Save supplier
$("#supplierForm").on("submit", function (e) {
  e.preventDefault();
  let formData = $(this).serializeObject();

  $.ajax({
    url: api + "suppliers/post",
    type: "POST",
    data: JSON.stringify(formData),
    contentType: "application/json; charset=utf-8",
    cache: false,
    processData: false,
    success: function (data) {
      $("#supplierFormModal").modal("hide");
      loadSuppliers();
      notiflix.Notify.success(data.message || "Supplier saved successfully!");
    },
    error: function (jqXHR) {
      notiflix.Report.failure(
        jqXHR.responseJSON?.error || "Error",
        jqXHR.responseJSON?.message || "An error occurred while saving the supplier.",
        "Ok"
      );
    }
  });
});

// Delete supplier
$(document).on("click", ".delete-supplier-btn", function () {
  let supplierId = $(this).data("id");
  let supplierName = $(this).data("name");

  notiflix.Confirm.show(
    "Delete Supplier",
    `Are you sure you want to delete "${supplierName}"?`,
    "Delete",
    "Cancel",
    function () {
      $.ajax({
        url: api + "suppliers/delete/" + supplierId,
        type: "DELETE",
        success: function (data) {
          loadSuppliers();
          notiflix.Notify.success(data.message || "Supplier deleted!");
        },
        error: function (jqXHR) {
          notiflix.Report.failure(
            "Error",
            jqXHR.responseJSON?.message || "Failed to delete supplier.",
            "Ok"
          );
        }
      });
    }
  );
});

// Search suppliers
$("#supplier-search").on("keyup", function () {
  let searchTerm = $(this).val().toLowerCase();
  let filtered = allSuppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm) ||
    (s.contact_person && s.contact_person.toLowerCase().includes(searchTerm)) ||
    (s.email && s.email.toLowerCase().includes(searchTerm))
  );
  renderSuppliersTable(filtered);
});

// Load suppliers when modal opens
$("#suppliersModal").on("show.bs.modal", function () {
  loadSuppliers();
});

// ============================================
// NETWORK INFO (MAIN SERVER)
// ============================================

function showNetworkInfo() {
  // Check if running as main server
  if (platform && platform.app === "Network Point of Sale Server") {
    $("#network-info-bar").show();
    
    // Get local IP addresses
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let serverIP = "127.0.0.1";
    
    for (let ifname in networkInterfaces) {
      for (let iface of networkInterfaces[ifname]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          serverIP = iface.address;
          break;
        }
      }
    }
    
    $("#server-ip").text(serverIP);
    $("#server-port").text(port);
    
  } else if (platform && platform.app === "Network Point of Sale Terminal") {
    // Show terminal badge instead
    $(".network-badge").removeClass("server-badge").addClass("terminal-badge")
      .html('<i class="glyphicon glyphicon-phone"></i> Terminal');
    $(".network-info-item").eq(0).html(`<i class="glyphicon glyphicon-globe"></i> Server: <span>${platform.ip || "--"}</span>`);
    $(".network-info-item").eq(1).html(`<i class="glyphicon glyphicon-transfer"></i> Till: <span>${platform.till || "--"}</span>`);
    $(".network-info-item").eq(2).hide();
    $("#network-info-bar").show();
  }
}

// Call on page load after settings are loaded
$(document).ready(function() {
  setTimeout(function() {
    showNetworkInfo();
  }, 2000);
  
  // Report button click handler
  $("#generateSalesReport").on("click", function() {
    generateSalesReport();
  });
});

// ============================================
// DETAILED SALES REPORT GENERATION
// ============================================

async function generateSalesReport() {
  const { jsPDF } = require('jspdf');
  
  // Helper function to draw tables manually
  function drawTable(doc, startY, headers, rows, options = {}) {
    const margin = options.margin || 15;
    const startX = options.startX || margin;
    const tableWidth = options.tableWidth || (doc.internal.pageSize.getWidth() - margin * 2);
    const colWidths = options.colWidths || rows[0].map(() => tableWidth / rows[0].length);
    const headerColor = options.headerColor || [44, 82, 130];
    const rowHeight = options.rowHeight || 7;
    const fontSize = options.fontSize || 8;
    
    let yPos = startY;
    
    // Draw header
    doc.setFillColor(...headerColor);
    doc.rect(startX, yPos, tableWidth, rowHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    
    let xPos = startX;
    headers.forEach((header, i) => {
      doc.text(header, xPos + colWidths[i] / 2, yPos + 5, { align: 'center' });
      xPos += colWidths[i];
    });
    yPos += rowHeight;
    
    // Draw rows
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    rows.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(startX, yPos, tableWidth, rowHeight, 'F');
      }
      
      xPos = startX;
      row.forEach((cell, i) => {
        const align = options.columnAlign && options.columnAlign[i] ? options.columnAlign[i] : 'left';
        const cellX = align === 'center' ? xPos + colWidths[i] / 2 : 
                     align === 'right' ? xPos + colWidths[i] - 2 : xPos + 2;
        doc.text(String(cell), cellX, yPos + 5, { align: align });
        xPos += colWidths[i];
      });
      yPos += rowHeight;
    });
    
    return yPos;
  }
  
  // Show loading
  notiflix.Loading.circle('Generating detailed report...');
  
  try {
    // Fetch all transaction data for the selected period
    const startDate = moment(start).format("DD-MMM-YYYY");
    const endDate = moment(end).format("DD-MMM-YYYY");
    
    // Get transactions data
    const response = await fetch(`${api}all`);
    const allTransactions = await response.json();
    
    // Filter by date range - dates are stored as YYYY-MM-DD HH:mm:ss
    const filteredTransactions = allTransactions.filter(t => {
      const tDate = moment(t.date, "YYYY-MM-DD HH:mm:ss");
      return tDate.isValid() && tDate.isBetween(moment(start), moment(end), 'day', '[]') && t.status === 1;
    });
    
    if (filteredTransactions.length === 0) {
      notiflix.Loading.remove();
      notiflix.Report.warning("No Data", "No transactions found for the selected period.", "Ok");
      return;
    }
    
    // Calculate analytics
    const analytics = calculateAnalytics(filteredTransactions);
    
    // Generate PDF
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;
    
    // Colors for PDF
    const colors = {
      primary: [26, 54, 93],
      primaryLight: [44, 82, 130],
      success: [56, 161, 105],
      info: [49, 130, 206],
      warning: [214, 158, 46],
      danger: [229, 62, 62],
      purple: [128, 90, 213],
      orange: [221, 107, 32],
      teal: [49, 151, 149]
    };
    
    // =====================
    // PAGE 1 - Dashboard Overview
    // =====================
    
    // Header
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.store || 'PharmaSpot', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Sales Analytics Report', pageWidth / 2, 23, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Period: ${startDate} to ${endDate}`, pageWidth / 2, 30, { align: 'center' });
    
    yPos = 45;
    
    // Summary Cards
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', margin, yPos);
    yPos += 8;
    
    const boxWidth = (pageWidth - margin * 2 - 15) / 4;
    const boxHeight = 25;
    const summaryData = [
      { label: 'Total Revenue', value: settings.symbol + moneyFormat(analytics.totalRevenue.toFixed(2)), color: colors.success },
      { label: 'Transactions', value: analytics.totalTransactions.toString(), color: colors.info },
      { label: 'Items Sold', value: analytics.totalItemsSold.toString(), color: colors.warning },
      { label: 'Avg. Transaction', value: settings.symbol + moneyFormat(analytics.avgTransaction.toFixed(2)), color: colors.purple }
    ];
    
    summaryData.forEach((item, i) => {
      const x = margin + (boxWidth + 5) * i;
      doc.setFillColor(...item.color);
      doc.roundedRect(x, yPos, boxWidth, boxHeight, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(item.label, x + boxWidth / 2, yPos + 8, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, x + boxWidth / 2, yPos + 18, { align: 'center' });
    });
    
    yPos += boxHeight + 15;
    
    // Daily Sales Visual (Bar Chart using rectangles)
    doc.setTextColor(...colors.primary);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Daily Sales Trend', margin, yPos);
    yPos += 8;
    
    const dailyData = analytics.dailySales.slice(-10);
    if (dailyData.length > 0) {
      const chartWidth = pageWidth / 2 - margin - 10;
      const chartHeight = 40;
      const maxVal = Math.max(...dailyData.map(d => d.total), 1);
      const barWidth = chartWidth / dailyData.length - 2;
      
      dailyData.forEach((d, i) => {
        const barHeight = (d.total / maxVal) * (chartHeight - 10);
        const x = margin + (i * (barWidth + 2));
        const y = yPos + chartHeight - barHeight - 8;
        
        doc.setFillColor(...colors.info);
        doc.rect(x, y, barWidth, barHeight, 'F');
        
        doc.setFontSize(5);
        doc.setTextColor(80, 80, 80);
        doc.text(d.date, x + barWidth / 2, yPos + chartHeight - 2, { align: 'center' });
      });
    }
    
    // Payment Methods Visual (Right side)
    doc.setTextColor(...colors.primary);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Methods', pageWidth / 2 + 10, yPos - 8);
    
    const paymentColors = [colors.success, colors.info, colors.warning, colors.danger, colors.purple];
    const paymentData = Object.entries(analytics.paymentMethods);
    const totalPayments = paymentData.reduce((sum, [, c]) => sum + c, 0);
    let payY = yPos;
    
    paymentData.forEach(([method, count], i) => {
      const pct = ((count / totalPayments) * 100).toFixed(1);
      const barW = (count / totalPayments) * 60;
      
      doc.setFillColor(...paymentColors[i % paymentColors.length]);
      doc.rect(pageWidth / 2 + 10, payY, 4, 6, 'F');
      
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      doc.text(method, pageWidth / 2 + 17, payY + 5);
      
      doc.setFillColor(...paymentColors[i % paymentColors.length]);
      doc.rect(pageWidth / 2 + 45, payY + 1, barW, 4, 'F');
      
      doc.setFontSize(7);
      doc.text(pct + '%', pageWidth / 2 + 47 + barW, payY + 5);
      
      payY += 9;
    });
    
    yPos += 50;
    
    // Store the yPos for side-by-side sections
    const sectionStartY = yPos;
    
    // Top Products Section (Left side)
    doc.setTextColor(...colors.primary);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Best Selling Products', margin, yPos);
    yPos += 8;
    
    const topProducts = analytics.topProducts.slice(0, 8);
    const maxQty = Math.max(...topProducts.map(p => p.qty), 1);
    const prodColors = [colors.success, colors.info, colors.warning, colors.danger, colors.purple, colors.orange, colors.teal, colors.primaryLight];
    
    topProducts.forEach((product, i) => {
      const barWidth = (product.qty / maxQty) * 50;
      const name = product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name;
      
      doc.setFontSize(7);
      doc.setTextColor(60, 60, 60);
      doc.text(name, margin, yPos + 4);
      
      doc.setFillColor(...prodColors[i % prodColors.length]);
      doc.rect(margin + 42, yPos, barWidth, 5, 'F');
      
      doc.setFontSize(6);
      doc.setTextColor(80, 80, 80);
      doc.text(product.qty.toString() + ' sold', margin + 44 + barWidth, yPos + 4);
      
      yPos += 8;
    });
    
    // Sales by Category (Right side) - start at same Y position
    let catY = sectionStartY;
    doc.setTextColor(...colors.primary);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Sales by Category', pageWidth / 2 + 10, catY);
    catY += 10;
    
    const categories = Object.entries(analytics.salesByCategory).slice(0, 8);
    const totalCatSales = categories.reduce((sum, [, v]) => sum + v, 0) || 1;
    
    categories.forEach(([cat, sales], i) => {
      const pct = ((sales / totalCatSales) * 100).toFixed(1);
      const barW = (sales / totalCatSales) * 50;
      const catName = cat.length > 18 ? cat.substring(0, 18) + '...' : cat;
      
      // Category color box
      doc.setFillColor(...prodColors[i % prodColors.length]);
      doc.rect(pageWidth / 2 + 10, catY - 3, 3, 6, 'F');
      
      // Category name
      doc.setFontSize(8);
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'normal');
      doc.text(catName, pageWidth / 2 + 15, catY + 1);
      
      // Progress bar background
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(pageWidth / 2 + 10, catY + 3, 70, 4, 1, 1, 'FD');
      
      // Progress bar fill
      doc.setFillColor(...prodColors[i % prodColors.length]);
      if (barW > 0) {
        doc.roundedRect(pageWidth / 2 + 10, catY + 3, Math.min(barW, 70), 4, 1, 1, 'F');
      }
      
      // Percentage and amount
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.text(pct + '%', pageWidth / 2 + 82, catY + 6);
      doc.setFontSize(6);
      doc.text(settings.symbol + moneyFormat(sales.toFixed(2)), pageWidth / 2 + 15, catY + 6);
      
      catY += 11;
    });
    
    // Move yPos to the max of both sections
    yPos = Math.max(yPos, catY) + 15;
    
    // Summary Tables on Page 1
    doc.setTextColor(...colors.primary);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Cashier Performance', margin, yPos);
    
    const cashierData = Object.entries(analytics.cashierPerformance).map(([name, data]) => [
      name,
      data.count.toString(),
      settings.symbol + moneyFormat(data.total.toFixed(2))
    ]);
    
    drawTable(doc, yPos + 5, ['Cashier', 'Sales', 'Total'], cashierData, {
      startX: margin,
      tableWidth: pageWidth / 2 - margin - 10,
      colWidths: [50, 20, 30],
      fontSize: 7,
      headerColor: colors.primaryLight,
      columnAlign: ['left', 'center', 'right']
    });
    
    // Payment Table on right
    doc.setTextColor(...colors.primary);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Summary', pageWidth / 2 + 10, yPos);
    
    const payTableData = Object.entries(analytics.paymentMethodsDetail).map(([method, data]) => [
      method,
      data.count.toString(),
      settings.symbol + moneyFormat(data.total.toFixed(2))
    ]);
    
    drawTable(doc, yPos + 5, ['Method', 'Count', 'Amount'], payTableData, {
      startX: pageWidth / 2 + 10,
      tableWidth: pageWidth / 2 - margin - 10,
      colWidths: [40, 20, 30],
      fontSize: 7,
      headerColor: colors.primaryLight,
      columnAlign: ['left', 'center', 'right']
    });
    
    // =====================
    // PAGE 2 - Detailed Product Sales
    // =====================
    doc.addPage();
    
    // Header for page 2
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Product Sales', pageWidth / 2, 13, { align: 'center' });
    
    yPos = 28;
    
    // Top Products Table
    doc.setTextColor(...colors.primary);
    doc.setFontSize(12);
    doc.text('Top Selling Products', margin, yPos);
    yPos += 5;
    
    const topProductsData = analytics.topProducts.slice(0, 25).map((p, i) => [
      (i + 1).toString(),
      p.name.substring(0, 40),
      p.qty.toString(),
      settings.symbol + moneyFormat(p.revenue.toFixed(2)),
      settings.symbol + moneyFormat((p.revenue / p.qty).toFixed(2))
    ]);
    
    drawTable(doc, yPos, ['#', 'Product Name', 'Qty', 'Revenue', 'Avg Price'], topProductsData, {
      colWidths: [10, 80, 20, 35, 35],
      fontSize: 8,
      headerColor: colors.primaryLight,
      columnAlign: ['center', 'left', 'center', 'right', 'right']
    });
    
    // Footer on all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated: ${moment().format('DD-MMM-YYYY HH:mm')} | Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text('Powered by PharmaSpot', pageWidth / 2, pageHeight - 5, { align: 'center' });
    }
    
    // Save the PDF using Blob method (more reliable)
    const filename = `Sales_Report_${moment().format("YYYY-MM-DD_HHmm")}.pdf`;
    const filePath = path.join(require('os').homedir(), 'Downloads', filename);
    
    // Get PDF as blob and convert to buffer
    const pdfBlob = doc.output('blob');
    const reader = new FileReader();
    
    reader.onload = function() {
      const fs = require('fs');
      const buffer = Buffer.from(new Uint8Array(reader.result));
      fs.writeFileSync(filePath, buffer);
      
      notiflix.Loading.remove();
      notiflix.Report.success(
        "Report Generated",
        `Sales report saved to Downloads folder`,
        "Open Folder",
        function() {
          require('electron').shell.showItemInFolder(filePath);
        }
      );
    };
    
    reader.onerror = function() {
      // Fallback method
      const fs = require('fs');
      const pdfData = doc.output('arraybuffer');
      fs.writeFileSync(filePath, Buffer.from(pdfData));
      
      notiflix.Loading.remove();
      notiflix.Report.success(
        "Report Generated",
        `Sales report saved to Downloads folder`,
        "Open Folder",
        function() {
          require('electron').shell.showItemInFolder(filePath);
        }
      );
    };
    
    reader.readAsArrayBuffer(pdfBlob);
    
  } catch (error) {
    console.error("Report generation error:", error);
    notiflix.Loading.remove();
    notiflix.Report.failure("Error", "Failed to generate report: " + error.message, "Ok");
  }
}

function calculateAnalytics(transactions) {
  const analytics = {
    totalRevenue: 0,
    totalTransactions: transactions.length,
    totalItemsSold: 0,
    avgTransaction: 0,
    paymentMethods: {},
    paymentMethodsDetail: {},
    dailySales: [],
    topProducts: [],
    salesByCategory: {},
    hourlySales: [],
    cashierPerformance: {}
  };
  
  const productSales = {};
  const dailyData = {};
  const hourlyData = {};
  
  // Initialize hourly data
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = { hour: i, count: 0, total: 0 };
  }
  
  transactions.forEach(t => {
    const total = parseFloat(t.total) || 0;
    analytics.totalRevenue += total;
    
    // Payment methods
    const method = t.payment_type || 'Cash';
    analytics.paymentMethods[method] = (analytics.paymentMethods[method] || 0) + 1;
    if (!analytics.paymentMethodsDetail[method]) {
      analytics.paymentMethodsDetail[method] = { count: 0, total: 0 };
    }
    analytics.paymentMethodsDetail[method].count++;
    analytics.paymentMethodsDetail[method].total += total;
    
    // Daily sales - dates are stored as YYYY-MM-DD HH:mm:ss
    const dateKey = moment(t.date, "YYYY-MM-DD HH:mm:ss").format("DD/MM");
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { date: dateKey, total: 0, count: 0 };
    }
    dailyData[dateKey].total += total;
    dailyData[dateKey].count++;
    
    // Hourly sales
    const hour = moment(t.date, "YYYY-MM-DD HH:mm:ss").hour();
    hourlyData[hour].count++;
    hourlyData[hour].total += total;
    
    // Cashier performance
    const cashier = t.user || 'Unknown';
    if (!analytics.cashierPerformance[cashier]) {
      analytics.cashierPerformance[cashier] = { count: 0, total: 0 };
    }
    analytics.cashierPerformance[cashier].count++;
    analytics.cashierPerformance[cashier].total += total;
    
    // Product sales
    if (t.items && Array.isArray(t.items)) {
      t.items.forEach(item => {
        analytics.totalItemsSold += parseInt(item.qty || item.quantity) || 1;
        const productId = item.id || item._id;
        const price = parseFloat(item.price) || 0;
        const qty = parseInt(item.qty || item.quantity) || 1;
        const productName = item.product_name || item.name || 'Unknown Product';
        
        if (!productSales[productId]) {
          productSales[productId] = {
            id: productId,
            name: productName,
            qty: 0,
            revenue: 0,
            category: item.category || 'Uncategorized'
          };
        }
        productSales[productId].qty += qty;
        productSales[productId].revenue += price * qty;
        
        // Category sales
        const categoryName = item.category ? (getCategoryName(item.category) || 'Uncategorized') : 'Uncategorized';
        if (categoryName !== '-') {
          analytics.salesByCategory[categoryName] = (analytics.salesByCategory[categoryName] || 0) + (price * qty);
        }
      });
    }
  });
  
  analytics.avgTransaction = analytics.totalRevenue / analytics.totalTransactions || 0;
  
  // Convert to arrays and sort
  analytics.dailySales = Object.values(dailyData).slice(-14); // Last 14 days
  analytics.topProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty);
  analytics.hourlySales = Object.values(hourlyData).filter(h => h.count > 0);
  
  // Sort category sales
  const sortedCategories = Object.entries(analytics.salesByCategory)
    .sort((a, b) => b[1] - a[1]);
  analytics.salesByCategory = Object.fromEntries(sortedCategories);
  
  return analytics;
}