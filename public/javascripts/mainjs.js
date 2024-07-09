function toggleClass(element, removeClass, addClass) {
  $(element).removeClass(removeClass).addClass(addClass);
}

$(function () {
  const mainSocket = io("http://autopool.local:4200", {
    path: "/socket.io",
    transports: ["polling"],
    transportOptions: {
      polling: {
        extraHeaders: {
          EIO: 4,
          t: "P2Ebc5G",
          sid: "dZA7q5x3x96k2i_IAAC0",
        },
      },
    },
  });

  mainSocket.on("connect", function () {
    mainSocket.send("Hello from client");
  });

  mainSocket.on("disconnect", function () {});

  mainSocket.on("pump", function (message) {
    parseMsgs(message);
  });

  mainSocket.on("body", function (message) {
    parsebodies(message);
  });

  mainSocket.on("temps", function (message) {
    parseTemps(message);
  });

  mainSocket.on("circuit", function (message) {
    parseOne(message);
  });

  mainSocket.on("heater", function (message) {
    parseMsgs(message);
  });

  mainSocket.on("controller", function (message) {});

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
    // value: "86, 88",
    min: "80",
    max: "90",
  });

  $("#spaSlider").roundSlider({
    radius: 150,
    width: 40,
    handleSize: "+0",
    sliderType: "range",
    // value: "98, 101",
    min: "94",
    max: "104",
  });

  $(".closers").on("click", function (e) {
    e.preventDefault();
    $("#poolTempModal, #spaTempModal").modal("hide");
  });

  allState();
  function parseMsgs(message) {
    if (message.name === "Spa Pump") {
      toggleClass(
        "#spaCirculation",
        message.isActive ? "btn-info" : "btn-circ",
        message.isActive ? "btn-circ" : "btn-info"
      );
      $("#spaOn").text(message.isActive ? " Spa Off" : " Spa On");
      $("#poOn").text(message.isActive ? " Pool On" : " Pool Off");
      spaPumpMaster = message.isActive;
    }
    if (message.name === "Spa Jets") {
      toggleClass(
        "#spaJets",
        message.isActive ? "btn-info" : "btn-circ",
        message.isActive ? "btn-circ" : "btn-info"
      );
      spaJetsMaster = message.isActive;
    }
    if (message.name === "Blower") {
      toggleClass(
        "#blowsHard",
        message.isActive ? "btn-info" : "btn-circ",
        message.isActive ? "btn-circ" : "btn-info"
      );
      blowerMaster = message.isActive;
    }
    if (message.name === "Pool Pump") {
      toggleClass(
        "#poolCirculation",
        message.isActive ? "btn-info" : "btn-circ",
        message.isActive ? "btn-circ" : "btn-info"
      );
      $("#poOn").text(message.isActive ? " Pool Off" : " Pool On");
      $("#spaOn").text(message.isActive ? " Spa On" : " Spa Off");
      $(".gauge").toggle(message.isActive);
      $("#pumpRPM")
        .text(message.rpm + " RPM | ")
        .append("&nbsp;");
      $("#pumpGPM")
        .text(message.flow + " GPM | ")
        .append("&nbsp;");
      $("#pumpWatt").text(message.watts + " Watt");
      poolPumpMaster = message.isActive;
    }
  }
 

  function parsebodies(message) {
    $.each(message, function (i, field) {
      if (field.name === "Pool") {
        $("#poolCurrentTemps").text("Is now: " + field.temp + "° F");
        const poolVals = field.setPoint + ", " + field.coolSetpoint;
        $("#poolSlider").roundSlider("setValue", poolVals);
        $("#poolSetTemps").text("Set for: " + poolVals + "° F");
        handleHeatStatus(field.heatStatus, poolWarm, poolCold, poolOff);
      }
      if (field.name === "Spa") {
        $("#spaCurrentTemps").text("Is now: " + field.temp + "° F");
        const spaVals = field.setPoint + ", " + field.coolSetpoint;
        $("#spaSlider").roundSlider("setValue", spaVals);
        $("#spaSetTemps").text("Set for: " + spaVals + "° F");
        handleHeatStatus(field.heatStatus, spaHot, spaCool, spaOff);
      }
    });
  }

  function parseTemps(message) {
    const bodes = message.bodies;
    $.each(bodes, function (i, data) {
      if (data.name === "Pool") {
        $("#poolCurrentTemps").text("Is now: " + data.temp + "° F");
        const poolVals = data.setPoint + ", " + data.coolSetpoint;
        $("#poolSlider").roundSlider("setValue", poolVals);
        $("#poolSetTemps").text("Set for: " + poolVals + "° F");
        handleHeatStatus(data.heatStatus, poolWarm, poolCold, poolOff);
      }
      if (data.name === "Spa") {
        $("#spaCurrentTemps").text("Is now: " + data.temp + "° F");
        const spaVals = data.setPoint + ", " + data.coolSetpoint;
        $("#spaSlider").roundSlider("setValue", spaVals);
        $("#spaSetTemps").text("Set for: " + spaVals + "° F");
        handleHeatStatus(data.heatStatus, spaHot, spaCool, spaOff);
      }
    });
  }

  function handleHeatStatus(
    heatStatus,
    heatingCallback,
    coolingCallback,
    offCallback
  ) {
    if (heatStatus) {
      switch (heatStatus.desc) {
        case "Heating":
          heatingCallback();
          heaterMaster = "Heating";
          break;
        case "Cooling":
          coolingCallback();
          heaterMaster = "Cooling";
          break;
        default:
          offCallback();
          heaterMaster = "Off";
      }
    } else {
      offCallback();
      heaterMaster = "Off";
    }
  }

  function allState() {
    $.getJSON("http://autopool.local:4200/state/all", function (data) {
      parseAll(data);
    });
  }

  function parseAll(data) {
    const circuits = data.circuits;
    circuits.forEach((circuit) => {
      var cName = circuit.name;
      var cState = circuit.isOn;
      changeStuff(cName, cState);
    });
 
    const heaters = data.heaters;
    heaters.forEach((heater) => {
      var heaterName = heater.name;
      var heaterState = heater.isOn;
      var isCooling = heater.isCooling;
      console.log(heaterName, heaterState, isCooling);
      changeTemps(heaterName, heaterState, isCooling);
    });
  }

  function parseOne(msg) {
    if (msg && msg.name && msg.isOn !== undefined) {
      const circuitName = msg.name;
      const circuitState = msg.isOn;
      changeStuff(circuitName, circuitState);
    } else {
      console.error("Invalid message format", msg);
    }
  }

  function changeStuff(data, status) {
    switch (data) {
      case "Blower":
        toggleClass(
          "#blowsHard",
          status ? "btn-info" : "btn-circ",
          status ? "btn-circ" : "btn-info"
        );
        break;
  
      case "Aerator":
        toggleClass(
          "#fount",
          status ? "btn-info" : "btn-circ",
          status ? "btn-circ" : "btn-info"
        );
        break;
  
      case "Spa Jets":
      case "Spa jets":
        toggleClass(
          "#spaJets",
          status ? "btn-info" : "btn-circ",
          status ? "btn-circ" : "btn-info"
        );
        break;
  
      case "Pool Clean":
      case "Pool Cond":
      case "Pool clean":
      case "Pool cond":
        $("#poOn").text(status ? " Pool Off" : " Pool On");
        $("#spaOn").text(status ? " Spa On" : " Spa Off");
        toggleClass(
          "#poolCirculation",
          status ? "btn-info" : "btn-circ",
          status ? "btn-circ" : "btn-info"
        );
        break;
  
      case "Spa Clean":
        $("#spaOn").text(status ? " Spa Off" : " Spa On");
        $("#poOn").text(status ? " Pool On" : " Pool Off");
        toggleClass(
          "#spaCirculation",
          status ? "btn-info" : "btn-circ",
          status ? "btn-circ" : "btn-info"
        );
        break;
  
      case "Spa Light":
      case "Spa Lights":
        toggleClass(
          "#spaLight",
          status ? "btn-info" : "btn-light",
          status ? "btn-light" : "btn-info"
        );
        break;
  
      case "Pool Light":
      case "Pool Lights":
        toggleClass(
          "#poolLight",
          status ? "btn-info" : "btn-light",
          status ? "btn-light" : "btn-info"
        );
        break;
  
      default:
        console.warn(`Unhandled data type: ${data}`);
        break;
    }
  }

  function changeTemps(data, status, cooling) {
    switch (data) {
      case "UltraTemp":
      // case "Heaters":
        if (cooling === true) {
          toggleClass(
            "#poolTempLink",
            status ? "btn-info" : "btn-primary",
            status ? "btn-primary" : "btn-info"
          )
        } else {
          toggleClass(
            "#poolTempLink",
            status ? "btn-info" : "btn-danger",
            status ? "btn-danger" : "btn-info"
          )
        }
          break;
      default:
        console.warn(`Unhandled data type: ${data}`);
        break;
      }
    }


  $("#poolSlider").roundSlider({
    stop: function () {
      // pauseWebSockets();
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
        // unpauseWebSockets();
      }, 500);
      $("#poolSetTemps").text(poolHeatTo + "° - " + poolCoolTo + "°F");
    },
  });

  $("#spaSlider").roundSlider({
    stop: function () {
      // pauseWebSockets();
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
      // unpauseWebSockets();
    },
  });

  $("#poolTempOnOff").on("click", function (e) {
    e.preventDefault();
    var $this = $(this);
    var tempData = { id: 1, mode: $this.hasClass("btn-secondary") ? 5 : 1 };
    $.ajax({
      type: "PUT",
      url: "http://autopool.local:4200/state/body/heatMode",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify(tempData),
      success: function (datartn) {
        var heatM = datartn.heatStatus;
        var descc = heatM.desc;
        if (descc === "Heating") poolWarm();
        else if (descc === "Cooling") poolCold();
        else poolOff();
      },
    });
  });

  $("#spaTempOnOff").on("click", function (e) {
    e.preventDefault();
    var $this = $(this);
    var tempData = { id: 2, mode: $this.hasClass("btn-secondary") ? 5 : 1 };
    $.ajax({
      type: "PUT",
      url: "http://autopool.local:4200/state/body/heatMode",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify(tempData),
      success: function (datartn) {
        var heatM = datartn.heatStatus;
        var descc = heatM.desc;
        if (descc === "Heating") spaHot();
        else if (descc === "Cooling") spaCool();
        else spaOff();
      },
    });
  });

  $("#poolCirculation").on("click", function (e) {
    e.preventDefault();
    var $this = $(this);
    var data1, data2;
    if ($this.hasClass("btn-info")) {
      data1 = { id: 6, state: true };
      data2 = { id: 2, state: true };
      $("#poOn").text(" Pool Off");
      $("#poolGauges").show();
    } else {
      data1 = { id: 6, state: false };
      data2 = { id: 2, state: false };
      $("#poOn").text(" Pool On");
      $("#poolGauges").hide();
    }
    setPool(data1);
    setTimeout(function () {
      setPool(data2);
    }, 500);
    var elem = $("#poolDelay");
    cntdown(elem, $this);
  });

  $("#spaCirculation").on("click", function (e) {
    e.preventDefault();
    var $this = $(this);
    var data = { id: 1, state: $this.hasClass("btn-info") };
    $("#spaOn").text($this.hasClass("btn-info") ? " Spa Off" : " Spa On");
    setPool(data);
    var elem = $("#spaDelay");
    cntdown(elem, $this);
  });

  function cntdown(a, b) {
    b.addClass("disabled");
    a.empty();
    let timeLeft = 25;
    let timerId = setInterval(function countdown() {
      if (timeLeft <= 0) {
        clearInterval(timerId);
        doSomething();
      } else {
        a.show();
        a.html(timeLeft + " sec delay");
        timeLeft--;
      }
    }, 1000);
  
    function doSomething() {
      a.hide();
      b.removeClass("disabled");
    }
  }

  $("#poolLight").on("click", function (e) {
    e.preventDefault();
    var $this = $(this);
    var data = { id: 7, state: $this.hasClass("btn-info") };
    changeStuff("Pool Lights", $this.hasClass("btn-info"));
    setPool(data);
  });

  $("#spaLight").on("click", function (e) {
    e.preventDefault();
    var $this = $(this);
    var data = { id: 8, state: $this.hasClass("btn-info") };
    changeStuff("Spa Lights", $this.hasClass("btn-info"));
    setPool(data);
  });

  $("#fount").on("click", function (e) {
    e.preventDefault();
    var $this = $(this);
    var data = { id: 5, state: $this.hasClass("btn-info") };
    changeStuff("Aerator", $this.hasClass("btn-info"));
    setPool(data);
  });

  $("#blowsHard").on("click", function (e) {
    e.preventDefault();
    var $this = $(this);
    var data = { id: 4, state: $this.hasClass("btn-info") };
    changeStuff("Blower", $this.hasClass("btn-info"));
    setPool(data);
  });

  $("#spaJets").on("click", function (e) {
    e.preventDefault();
    var $this = $(this);
    var data = { id: 3, state: $this.hasClass("btn-info") };
    changeStuff("Spa Jets", $this.hasClass("btn-info"));
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

  function setPool(data) {
    $.ajax({
      type: "PUT",
      url: "http://autopool.local:4200/state/circuit/setState",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify(data),
      success: function (data) {
        return data;
      },
    });
  }
  allState();
  // function setPool(jdata) {
  //   $.ajax({
  //     type: "PUT",
  //     url: "http://autopool.local:4200/state/circuit/setState",
  //     contentType: "application/json; charset=utf-8",
  //     dataType: "json",
  //     data: JSON.stringify(jdata),
  //     success: function (data) {
  //       return data;
  //     },
  //   });
  // }

  function setPoolCond(data) {
    $.ajax({
      type: "PUT",
      url: "http://autopool.local:4200/state/body/setPoint",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify(data),
      success: function (dataz) {
        return true;
      },
    });
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
    $("#poolTempOnOff").html(" off");
    $("#poolTempOnOff").addClass("btn-primary");
    $("#poolTempOnOff").removeClass("btn-secondary");
    $(".pFlake").show();
    $(".pFlame").hide();
  }

  function poolWarm() {
    $("#poolTempLink").removeClass("btn-info");
    $("#poolTempLink").removeClass("btn-primary");
    $("#poolTempLink").addClass("btn-danger");
    $("#poolTempOnOff").html(" off");
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
});