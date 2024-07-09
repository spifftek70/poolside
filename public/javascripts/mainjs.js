$(function () {
  allState();
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

  $(".closers").on("click", function (e) {
    e.preventDefault();
    $("#poolTempModal, #spaTempModal").modal("hide");
  });

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
        const poolVals = field.setPoint + " - " + field.coolSetpoint;
        $("#poolSlider").roundSlider("setValue", poolVals);
        $("#poolSetTemps").text("Set for: " + poolVals + "° F");
        handleHeatStatus(field.heatStatus, poolWarm, poolCold, poolOff);
      }
      if (field.name === "Spa") {
        $("#spaCurrentTemps").text("Is now: " + field.temp + "° F");
        const spaVals = field.setPoint + " - " + field.coolSetpoint;
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
        const poolVals = data.setPoint + " - " + data.coolSetpoint;
        $("#poolSlider").roundSlider("setValue", poolVals);
        $("#poolSetTemps").text("Set for: " + poolVals + "° F");
        handleHeatStatus(data.heatStatus, poolWarm, poolCold, poolOff);
      }
      if (data.name === "Spa") {
        $("#spaCurrentTemps").text("Is now: " + data.temp + "° F");
        const spaVals = data.setPoint + " - " + data.coolSetpoint;
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
    function toggleClass(element, removeClass, addClass) {
      $(element).removeClass(removeClass).addClass(addClass);
    }

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
        $("#spaOn").text(status ? " Spa Off" : " Spa On");
        $("#poOn").text(status ? " Pool On" : " Pool Off");
        toggleClass(
          "#spaJets",
          status ? "btn-info" : "btn-circ",
          status ? "btn-circ" : "btn-info"
        );
        break;

      case "Pool Clean":
      case "Pool Cond":
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
      let timerId = setInterval(countdown, 1000);

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
  // });

  function setPool(jdata) {
    $.ajax({
      type: "PUT",
      url: "http://autopool.local:4200/state/circuit/setState",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify(jdata),
      success: function (data) {
        return data;
      },
    });
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

  // function poolOn(){
  //   $("#poolCirculation").removeClass("btn-info");
  //   $("#poolCirculation").addClass("btn-circ");
  // }

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

  // function spaOn(){
  //   $("#spaCirculation").removeClass("btn-info");
  //   $("#spaCirculation").addClass("btn-circ");
  // }

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

  var ck1;
  var aC1;
  var ck2;
  var aC2;

  function statusUpdate(a, b) {
    // console.log("A and B: ", a, b);
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
      $("#poolCirculation").removeClass("btn-info");
      $("#poolCirculation").addClass("btn-circ");
      $("#poOn").text(" Pool Off");
    }
    if (a === 1 && b === false) {
      $("#poolCirculation").removeClass("btn-circ");
      $("#poolCirculation").addClass("btn-info");
      $("#poOn").text(" Pool On");
    }
    if (a === 2 && b === true) {
      $("#spaCirculation").removeClass("btn-info");
      $("#spaCirculation").addClass("btn-circ");
      $("#spaOn").text(" Spa Off");
    }
    if (a === 2 && b === false) {
      $("#spaCirculation").removeClass("btn-circ");
      $("#spaCirculation").addClass("btn-info");
      $("#spaOn").text(" Spa On");
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
});
