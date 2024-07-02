$(function () {
  const mainSocket = io("http://autopool.local:4200", {
    path: "/socket.io",
    transports: ["websocket"],
  });
  
  // const logSocket = io("http://autopool.local:4200", {
  //   path: "/socket.io",
  //   transports: ["websocket"],
  // });

  mainSocket.on("connect", function () {
    // console.log("Connected to WebSocket server");
    mainSocket.send("Hello from client");
  });

  mainSocket.on("message", function (message) {
    // console.log("Received message:", message);
  });

  mainSocket.on("disconnect", function () {
    // console.log("Disconnected from WebSocket server");
  });

  $(".pFlame, .pFlake, .sFlame, .sFlake, #poolDelay, #spaDelay").hide();

  $("#topheader .navbar-nav a").on("click", function () {
    $("#collapsibleNavbar > ul").find("a.active").removeClass("active");
    $(this).parent("a").addClass("active");
  });

  $(".nav-link").on("click", function () {
    $(".nav-item").find("a.active").removeClass("active");
    $(this).addClass("active");
  });

  $("#poolSlider").roundSlider({
    radius: 150,
    width: 40,
    handleSize: "+0",
    sliderType: "range",
    value: "86, 88",
    min: "80",
    max: "90",
  });

  $("#spaSlider").roundSlider({
    radius: 150,
    width: 40,
    handleSize: "+0",
    sliderType: "range",
    value: "98, 101",
    min: "94",
    max: "104",
  });

  // getStatus();

  $(".closers").on("click", function (e) {
    e.preventDefault();
    $("#poolTempModal, #spaTempModal").modal("hide");
  });

  // function connectLogWebSocket() {
  //   const socket = io("https://autopool.local:4200", {
  //     path: "/socket.io",
  //     transports: ["websocket"],
  //   });

  //   socket.on("connect", function () {
  //     console.log("WebSocket connection established.");
  //   });

  //   socket.on("message", function (message) {
  //     try {
  //       const data = JSON.parse(message);
  //       if (data.message) {
  //         let messageContent = data.message;
  //         if (messageContent.includes("progress update")) {
  //           console.log("msg content: ", messageContent);
  //         } else if (messageContent.includes("progress completion")) {
  //           completeProgress();
  //         } else {
  //           updateLog(messageContent);
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Error processing WebSocket message:", error);
  //     }
  //   });

  //   socket.on("disconnect", function (e) {
  //     console.log("Disconnected from WebSocket server");
  //   });

  //   socket.on("error", function (err) {
  //     console.error("WebSocket encountered error: ", err.message);
  //   });

  //   return socket;
  // }

  function getStatus() {
    // Listen for status updates from the WebSocket
    mainSocket.on("message", function (message) {
      try {
        const json = JSON.parse(message);
        console.log("message: ", message);
        var aa;
        var bb;
        var cc;
        var cnom;
        var poolVals;
        var spaVals;
        var spaSetPt;
        var spaCoolSetpt;
        var poolSetPts;
        var poolCoolSetpt;
        var poolChil;
        var spaChil;
      
        var circ = json.circuits;
        var teps = json.temps;
        var heaters = json.heaters;
        $.each(circ, function (i, field) {
          console.log("field: ", field);
          aa = field.id;
          bb = field.isOn;
          $.each(teps.bodies, function (i, eid) {
            console.log("eid: ", eid);
            cc = eid.temp;
            dd = eid.heatStatus;
            ee = eid.heatMode;
            cnom = eid.name;
            if (cnom == "Spa") {
              spaChil = cc;
              spaSetPt = eid.setPoint;
              spaCoolSetpt = eid.coolSetpoint;
              spaVals = spaSetPt.toString() + ", " + spaCoolSetpt.toString();
              $("#spaSlider").roundSlider("setValue", spaVals);
              $("#spaCurrentTemps").text(spaChil);
            }
            if (cnom == "Pool") {
              poolChil = cc;
              poolSetPts = eid.setPoint;
              poolCoolSetpt = eid.coolSetpoint;
              poolVals =
                poolSetPts.toString() + ", " + poolCoolSetpt.toString();
              $("#poolSlider").roundSlider("setValue", poolVals);
              $("#poolCurrentTemps").text(poolChil);
            }
            statusUpdate(aa, bb);
          });
        });
        $.each(heaters, function (i, hett) {
          var bID = hett.bodyId;
          var hID = hett.isOn;
          var isCool = hett.isCooling;
          makeChanges(bID, hID, isCool);
        });
        $("#poolCurrentTemps").text(poolChil);
        $("#poolSetTemps").text(poolSetPts + "° - " + poolCoolSetpt + "°F");
        $("#spaCurrentTemps").text(spaChil);
        $("#spaSetTemps").text(spaSetPt + "° - " + spaCoolSetpt + "°F");
      } catch (error) {
        console.error("Error processing status update:", error);
      }
    });
  }

  $("#poolSlider").roundSlider({
    stop: function () {
      var poolHeatTo = $("#poolSlider").roundSlider("getValue", 1);
      var poolCoolTo = $("#poolSlider").roundSlider("getValue", 2);
      var tmpdataLow = {
        id: 1,
        heatSetpoint: poolHeatTo,
      };
      var tmpdataHi = {
        id: 1,
        coolSetpoint: poolCoolTo,
      };
      setPoolCond(tmpdataLow);
      setTimeout(function () {
        setPoolCond(tmpdataHi);
      }, 500);
      $("#poolSetTemps").text(poolHeatTo + "° - " + poolCoolTo + "°F");
    },
  });

  $("#spaSlider").roundSlider({
    stop: function () {
      var spaHeatTo = $("#spaSlider").roundSlider("getValue", 1);
      var spaCoolTo = $("#spaSlider").roundSlider("getValue", 2);
      var tmpdataLow = {
        id: 2,
        coolSetpoint: spaHeatTo,
      };
      var tmpdataHi = {
        id: 2,
        heatSetpoint: spaCoolTo,
      };
      setPoolCond(tmpdataLow);
      setTimeout(function () {
        setPoolCond(tmpdataHi);
      }, 500);
      $("#spaSetTemps").text(spaHeatTo + "° - " + spaCoolTo + "°F");
    },
  });

  $("#poolTempOnOff").on("click", function (e) {
    e.preventDefault();
    var $this = $(this);
    var tempData;
    if ($this.hasClass("btn-secondary")) {
      tempData = {
        id: 1,
        mode: 5,
      };
    } else {
      tempData = {
        id: 1,
        mode: 1,
      };
    }
    $.ajax({
      type: "PUT",
      url: "https://autopool.local:4200/state/body/heatMode",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify(tempData),
      success: function (datartn) {
        var heatM = datartn.heatStatus;
        var descc = heatM.desc;
        if (descc == "Heating") {
          poolWarm();
        } else if (descc == "Cooling") {
          poolCold();
        } else {
          poolOff();
        }
      },
    });
    return true;
  });

  $("#spaTempOnOff").on("click", function (e) {
    e.preventDefault();
    var $this = $(this);
    var tempData;
    if ($this.hasClass("btn-secondary")) {
      tempData = {
        id: 2,
        mode: 5,
      };
    } else {
      tempData = {
        id: 2,
        mode: 1,
      };
    }
    $.ajax({
      type: "PUT",
      url: "https://autopool.local:4200/state/body/heatMode",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify(tempData),
      success: function (datartn) {
        var heatM = datartn.heatStatus;
        var descc = heatM.desc;
        if (descc == "Heating") {
          spaHot();
        } else if (descc == "Cooling") {
          spaCool();
        } else {
          spaOff();
        }
      },
    });
    return true;
  });

  $("#poolCirculation").on("click", function (e) {
    e.preventDefault();
    var $this = $(this);
    var data1, data2;
    if ($this.hasClass("btn-info")) {
      data1 = {
        id: 6,
        state: true,
      };
      data2 = {
        id: 2,
        state: true,
      };
    } else {
      data1 = {
        id: 6,
        state: false,
      };
      data2 = {
        id: 2,
        state: false,
      };
    }
    setPool(data1);
    setTimeout(function () {
      setPool(data2);
    }, 500);
    var elem = $("#poolDelay");
    cntdown(elem, $this);
    setTimeout(function () {
      $this.toggleClass("btn-info btn-circ");
    }, 25000);
  });

  $("#spaCirculation").on("click", function (e) {
    e.preventDefault();
    var $this = $(this);
    var data;
    if ($this.hasClass("btn-info")) {
      data = {
        id: 1,
        state: true,
      };
    } else {
      data = {
        id: 1,
        state: false,
      };
    }
    setPool(data);
    var elem = $("#spaDelay");
    cntdown(elem, $this);
    setTimeout(function () {
      $this.toggleClass("btn-info btn-circ");
    }, 25000);
  });

  function cntdown(a, b) {
    b.addClass("disabled");
    a.empty();
    if (!timerId) {
      var timeLeft = 25;
      var timerId = setInterval(countdown, 1000);
    } else {
      clearInterval(timerId);
      timerId = null;
    }
    function countdown() {
      if (timeLeft <= 0) {
        clearInterval(timerId);
        doSomething();
      } else {
        a.show();
        a.html(timeLeft + " sec delay");
        timeLeft--;
      }
    }

    function doSomething() {
      a.hide();
      b.removeClass("disabled");
    }
  }

  $("#poolLight").on("click", function (e) {
    e.preventDefault();
    var data;
    if ($("#poolLight").hasClass("btn-info")) {
      data = {
        id: 7,
        state: true,
      };
    } else {
      data = {
        id: 7,
        state: false,
      };
    }
    $("#poolLight").toggleClass("btn-info btn-warning");
    setPool(data);
  });

  $("#spaLight").on("click", function (e) {
    e.preventDefault();
    var data;
    if ($("#spaLight").hasClass("btn-info")) {
      data = {
        id: 8,
        state: true,
      };
    } else {
      data = {
        id: 8,
        state: false,
      };
    }
    $(this).toggleClass("btn-info btn-warning");
    setPool(data);
  });

  $("#fount").on("click", function (e) {
    e.preventDefault();
    var data;
    if ($(this).hasClass("btn-info")) {
      data = {
        id: 5,
        state: true,
      };
    } else {
      data = {
        id: 5,
        state: false,
      };
    }
    $(this).toggleClass("btn-info btn-circ");
    setPool(data);
  });

  $("#blowsHard").on("click", function (e) {
    e.preventDefault();
    var data;
    if ($(this).hasClass("btn-info")) {
      data = {
        id: 4,
        state: true,
      };
    } else {
      data = {
        id: 4,
        state: false,
      };
    }
    $("#blowsHard").toggleClass("btn-info btn-light");
    setPool(data);
  });

  $("#spaJets").on("click", function (e) {
    e.preventDefault();
    var data;
    if ($(this).hasClass("btn-info")) {
      data = {
        id: 3,
        state: true,
      };
    } else {
      data = {
        id: 3,
        state: false,
      };
    }
    $("#spaJets").toggleClass("btn-info btn-circ");
    setPool(data);
  });

  $("#poolTempLink").on("click", function (e) {
    e.preventDefault();
    $("#poolTempModal").modal("show");
  });

  $("#spaTempLink").on("click", function (e) {
    e.preventDefault();
    $("#spaTempModal").modal("show");
  });

  $(".btn-close").on("click", function (e) {
    e.preventDefault();
    $("#poolTempModal, #spaTempModal").modal("hide");
  });

  function setPool(jdata) {
    $.ajax({
      type: "PUT",
      url: "https://autopool.local:4200/state/circuit/setState",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify(jdata),
      success: function (data) {
        return data;
      },
    });
  }

  function makeChanges(bb, hh, iSS) {
    if (bb == 0) {
      bothOff();
      return true;
    }
    if (bb == 2 && hh == true && iSS == false) {
      spaHot();
    } else if (bb == 2 && hh == true && iSS == true) {
      spaCool();
    } else if (bb == 1 && hh == true && iSS == false) {
      poolWarm();
    } else if (bb == 1 && hh == true && iSS == true) {
      poolCold();
    } else {
      return true;
    }
    return true;
  }

  function poolOff() {
    $("#poolTempLink").removeClass("btn-primary");
    $("#poolTempLink").removeClass("btn-danger");
    $("#poolTempLink").addClass("btn-info");
    $("#poolTempOnOff").html(" On");
    $("#poolTempOnOff").addClass("btn-secondary");
    $("#poolTempOnOff").removeClass("btn-primary");
    $(".pFlake").hide();
    $(".pFlame").hide();
  }

  function poolCold() {
    $("#poolTempLink").removeClass("btn-info");
    $("#poolTempLink").removeClass("btn-danger");
    $("#poolTempLink").addClass("btn-primary");
    $("#poolTempOnOff").html('<i class="fa-solid fa-power-off"></i> off');
    $("#poolTempOnOff").addClass("btn-primary");
    $("#poolTempOnOff").removeClass("btn-secondary");

    $(".pFlake").show();
    $(".pFlame").hide();
  }

  function poolWarm() {
    $("#poolTempLink").removeClass("btn-info");
    $("#poolTempLink").removeClass("btn-primary");
    $("#poolTempLink").addClass("btn-danger");
    $("#poolTempOnOff").html('<i class="fa-solid fa-power-off"></i> off');
    $("#poolTempOnOff").addClass("btn-primary");
    $("#poolTempOnOff").removeClass("btn-secondary");
    $(".pFlake").hide();
    $(".pFlame").show();
  }

  function spaOff() {
    $("#spaTempLink").removeClass("btn-primary");
    $("#spaTempLink").removeClass("btn-danger");
    $("#spaTempLink").addClass("btn-info");
    $("#spaTempOnOff").html(" On");
    $("#spaTempOnOff").addClass("btn-secondary");
    $("#spaTempOnOff").removeClass("btn-primary");
    $(".pFlake").hide();
    $(".pFlame").hide();
  }

  function spaCool() {
    $("#spaTempLink").removeClass("btn-info");
    $("#spaTempLink").removeClass("btn-danger");
    $("#spaTempLink").addClass("btn-primary");
    $("#spaTempOnOff").html(" Off");
    $("#spaTempOnOff").removeClass("btn-secondary");
    $("#spaTempOnOff").addClass("btn-primary");
    $(".sFlame").hide();
    $(".sFlake").show();
  }

  function spaHot() {
    $("#spaTempLink").removeClass("btn-info");
    $("#spaTempLink").removeClass("btn-primary");
    $("#spaTempLink").addClass("btn-danger");
    $("#spaTempOnOff").html(" Off");
    $("#spaTempOnOff").removeClass("btn-secondary");
    $("#spaTempOnOff").addClass("btn-primary");
    $(".sFlake").hide();
    $(".sFlame").show();
  }

  function bothOff() {
    $("#spaTempLink").removeClass("btn-danger");
    $("#spaTempLink").removeClass("btn-primary");
    $("#spaTempLink").addClass("btn-info");
    $("#poolTempLink").removeClass("btn-danger");
    $("#poolTempLink").removeClass("btn-primary");
    $("#poolTempLink").addClass("btn-info");
    $("#poolTempOnOff").html(" On");
    $("#poolTempOnOff").removeClass("btn-primary");
    $("#poolTempOnOff").addClass("btn-secondary");
    $("#spaTempOnOff").html(" On");
    $("#spaTempOnOff").removeClass("btn-primary");
    $("#spaTempOnOff").addClass("btn-secondary");
    $(".pFlake, .pFlame, .sFlake, .sFlame").hide();
  }

  function setPoolCond(data) {
    $.ajax({
      type: "PUT",
      url: "https://autopool.local:4200/state/body/setPoint",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify(data),
      success: function (dataz) {
        return true;
      },
    });
    return true;
  }

  var ck1;
  var aC1;
  var ck2;
  var aC2;

  function statusUpdate(a, b) {
    if (a === 6 && b === true) {
      ck1 = true;
      aC1 = true;
    }
    if (a === 6 && b === false) {
      ck1 = true;
      aC1 = false;
    }
    if (a === 2 && b === true) {
      ck2 = true;
      aC2 = true;
    }
    if (a === 2 && b === false) {
      ck2 = false;
      aC2 = false;
    }
    if (a === 1 && b === true) {
      $("#spaCirculation").removeClass("btn-info");
      $("#spaCirculation").addClass("btn-circ");
      $("#spOn").text(" Spa Off");
    }
    if (a === 1 && b === false) {
      $("#spaCirculation").removeClass("btn-circ");
      $("#spaCirculation").addClass("btn-info");
      $("#spOn").text(" Spa On");
    }
    if (aC1 === true || aC2 === true) {
      $("#poolCirculation").removeClass("btn-info");
      $("#poolCirculation").addClass("btn-circ");
      $("#poOn").text(" Pool Off");
    } else {
      $("#poolCirculation").removeClass("btn-circ");
      $("#poolCirculation").addClass("btn-info");
      $("#poOn").text(" Pool On");
    }
    if (a === 3 && b === true) {
      $("#spaJets").removeClass("btn-info");
      $("#spaJets").addClass("btn-circ");
    }
    if (a === 3 && b === false) {
      $("#spaJets").removeClass("btn-circ");
      $("#spaJets").addClass("btn-info");
    }
    if (a === 4 && b === true) {
      $("#blowsHard").removeClass("btn-info");
      $("#blowsHard").addClass("btn-light");
    }
    if (a === 4 && b === false) {
      $("#blowsHard").removeClass("btn-light");
      $("#blowsHard").addClass("btn-info");
    }
    if (a === 5 && b === true) {
      $("#fount").removeClass("btn-info");
      $("#fount").addClass("btn-circ");
    }
    if (a === 5 && b === false) {
      $("#fount").removeClass("btn-circ");
      $("#fount").addClass("btn-info");
    }
    if (a === 7 && b === true) {
      $("#poolLight").removeClass("btn-info");
      $("#poolLight").addClass("btn-warning");
    }
    if (a === 7 && b === false) {
      $("#poolLight").removeClass("btn-warning");
      $("#poolLight").addClass("btn-info");
    }
    if (a === 8 && b === true) {
      $("#spaLight").removeClass("btn-info");
      $("#spaLight").addClass("btn-warning");
    }
    if (a === 8 && b === false) {
      $("#spaLight").removeClass("btn-warning");
      $("#spaLight").addClass("btn-info");
    } else return;
  }

  // setInterval(function (e) {
  //   getStatus();
  // }, 5000);
});
