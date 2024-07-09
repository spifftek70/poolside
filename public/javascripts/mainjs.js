$(function () {

  allState();
  const mainSocket = io("http://autopool.local:4200", {
    path: "/socket.io",
    transports: ["polling"], // Change transport method to polling
    transportOptions: {
      polling: {
        extraHeaders: {
          EIO: 4, // Engine.IO protocol version
          t: "P2Ebc5G", // Custom query parameter `t`
          sid: "dZA7q5x3x96k2i_IAAC0" // Custom query parameter `sid`
        }
      }
    }
  });

  mainSocket.on("connect", function () {
    // console.log("Connected to WebSocket server");
    mainSocket.send("Hello from client");
  });

  mainSocket.on("disconnect", function () {
    // console.log("Disconnected from WebSocket server");
  });

  mainSocket.on("pump", function (message) {
    // console.log("Pump message: ", message);
    parseMsgs(message);
  });

  mainSocket.on("body", function (message) {
    // console.log("Body message: ", message);
    parsebodies(message);
  });

  mainSocket.on("temps", function (message) {
    // console.log("Temps message: ", message);
    parseTemps(message);
  });

  mainSocket.on("circuit", function (message) {
    // console.log("Temps message: ", message);
    parseOne(message);
  });

  mainSocket.on("heater", function (message) {
    // console.log("Heater message: ", message);
    parseMsgs(message);
  });

  mainSocket.on("controller", function (message) {
    // console.log("Controller message: ", message);
    // parseMsg(message);
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

  function parseMsgs(message){
    // $.each(message, function (i, message) {
      var aa;
      var bb;
      var ee;
      var ff;
      var gg;
      if (message.name === "Spa Pump") {
        aa = message.id;
        bb = message.isActive;
        if (bb === true){
          $("#spaCirculation").removeClass("btn-info");
          $("#spaCirculation").addClass("btn-circ");
          $("#spaOn").text(" Spa Off");
          $("#poOn").text(" Pool On");
          spaPumpMaster = true;
        } else {
          $("#spaCirculation").removeClass("btn-circ");
          $("#spaCirculation").addClass("btn-info");
          $("#spaOn").text(" Spa On");
          $("#poOn").text(" Pool Off");
          spaPumpMaster = false;
        }
      }
      if (message.name === "Spa Jets") {
        aa = message.id;
        bb = message.isActive;
        if (bb === true){
          $("#spaJets").removeClass("btn-info")
          $("#spaJets").addClass("btn-circ");
          spaJetsMaster = true;
        } else {
          $("#spaJets").removeClass("btn-circ");
          $("#spaJets").addClass("btn-info");
          spaJetsMaster = false;
        }
      }
      if (message.name === "Blower") {
        aa = message.id;
        bb = message.isActive;
        if (bb === true){
          $("#blowsHard").removeClass("btn-info")
          $("#blowsHard").addClass("btn-circ");
          blowerMaster = true;
        } else {
          $("#blowsHard").removeClass("btn-circ");
          $("#blowsHard").addClass("btn-info");
          blowerMaster = false;
        }
      }
      if (message.name === "Pool Pump") {
        aa = message.id;
        bb = message.isActive;
        ee = message.rpm;
        ff = message.watts;
        gg = message.flow;
        if (bb === true){
          $("#poolCirculation").removeClass("btn-info");
          $("#poolCirculation").addClass("btn-circ");
          $("#poOn").text(" Pool Off");
          $("#spaOn").text(" Spa On");
          $(".gauge").show();
          $("#pumpRPM").text(ee + " RPM | ");
          $("#pumpRPM").append("&nbsp;");
          $("#pumpGPM").text(gg + " GPM | ");
          $("#pumpGPM").append("&nbsp;");
          $("#pumpWatt").text(ff + " Watt");
          poolPumpMaster = true;
        } else {
          $("#poolCirculation").removeClass("btn-circ");
          $("#poolCirculation").addClass("btn-info");
          $("#poOn").text(" Pool On");
          $("#spaOn").text(" Spa Off");
          $(".gauge").hide();
          poolPumpMaster = false;
        }
      }
  }

  function parsebodies(message) {
    var aa;
    var bb;
    var cc;
    var dd;
    $.each(message, function (i, field) {
      if (field.id === 1) {
        if (field.name === "Pool") {
          aa = field.id;
          bb = field.isOn;
          $("#poolCurrentTemps").text("Is now: " + message.temp + "° F");
          const poolCoolSetpt = field.coolSetpoint;
          const poolSetPt = field.setPoint;
          const poolVals = poolSetPt.toString() + " - " + poolCoolSetpt.toString();
          $("#poolSlider").roundSlider("setValue", poolVals);
          $("#poolSetTemps").text("Set for: " + poolVals + "° F");
          if ('heatStatus' in field) {
            cc = field.heatStatus;
            dd = cc.desc;
            if (dd === "Heating") {
              poolWarm();
              heaterMaster = "Heating";
            } else if (dd === "Cooling") {
              heaterMaster = "Cooling";
              poolCold();
            } else {
              poolOff();
              heaterMaster = "Off";
            }
          }
          // statusUpdate(aa, bb);
        }
        if (field.name === "Spa") {
          aa = field.id;
          bb = field.isOn;
          $("#spaCurrentTemps").text("Is now: " + field.temp + "° F");
          const spaCoolSetpt = field.coolSetpoint;
          const spaSetPt = field.setPoint;
          const spaVals = spaSetPt.toString() + " - " + spaCoolSetpt.toString();
          $("#spaSlider").roundSlider("setValue", spaVals);
          $("#spaSetTemps").text("Set for: " + spaVals + "° F");
          if ('heatStatus' in field) {
            cc = field.heatStatus;
            dd = cc.desc;
            if (dd === "Heating") {
              heaterMaster = "Heating";
              spaHot();
            } else if (dd === "Cooling") {
              heaterMaster = "Cooling";
              spaCool();
            } else {
              spaOff();
              heaterMaster = "Off";
            }
          }
          // statusUpdate(aa, bb);
        }
      }
    });
  }
  
  function parseTemps(message) {
    var aa;
    var bb;
    var bodes = message.bodies;
    $.each(bodes, function (i, data) {
      if (data.name === "Pool") {
        aa = data.id;
        bb = data.isOn;
        $("#poolCurrentTemps").text("Is now: " + data.temp + "° F");  
        const poolCoolSetpt = data.coolSetpoint;
        const poolSetPt = data.setPoint;
        const poolVals = poolSetPt.toString() + " - " + poolCoolSetpt.toString();
        $("#poolSlider").roundSlider("setValue", poolVals);
        $("#poolSetTemps").text("Set for: " + poolVals + "° F");
        if ('heatStatus' in data) {
          const cc = data.heatStatus;
          const dd = cc.desc;
          if (dd === "Heating") {
            poolWarm();
            heaterMaster = "Heating";
          } else if (dd === "Cooling") {
            poolCold();
            heaterMaster = "Cooling"
          } else {
            poolOff();
            heaterMaster = "Off";
          }
        }
        // statusUpdate(aa, bb);
      }
      if (data.name === "Spa") {
        aa = data.id;
        bb = data.isOn;
        $("#spaCurrentTemps").text("Is now: " + data.temp + "° F");
        const spaCoolSetpt = data.coolSetpoint;
        const spaSetPt = data.setPoint;
        const spaVals = spaSetPt.toString() + " - " + spaCoolSetpt.toString();
        $("#spaSlider").roundSlider("setValue", spaVals);
        $("#spaSetTemps").text("Set for: " + spaVals + "° F");
        if ('heatStatus' in data) {
          const cc = data.heatStatus;
          const dd = cc.desc;
          if (dd === "Heating") {
            spaHot();
            heaterMaster = "Heating";
          } else if (dd === "Cooling") {
            spaCool();
            heaterMaster = "Cooling";
          } else {
            spaOff();
            heaterMaster = "Off";
          }
        }
        // statusUpdate(aa, bb);
      }
    });
  }

  // function getStatus() {
  //   // Listen for status updates from the WebSocket
  //   mainSocket.on("message", function (message) {
  //     try {
  //       const json = JSON.parse(message);
  //       console.log("message: ", message);
  //       var aa;
  //       var bb;
  //       var cc;
  //       var cnom;
  //       var poolVals;
  //       var spaVals;
  //       var spaSetPt;
  //       var spaCoolSetpt;
  //       var poolSetPts;
  //       var poolCoolSetpt;
  //       var poolChil;
  //       var spaChil;

  //       var circ = json.circuits;
  //       var teps = json.temps;
  //       var heaters = json.heaters;
  //       $.each(circ, function (i, data) {
  //         console.log("data: ", data);
  //         aa = data.id;
  //         bb = data.isOn;
  //         $.each(teps.bodies, function (i, eid) {
  //           console.log("eid: ", eid);
  //           cc = eid.temp;
  //           dd = eid.heatStatus;
  //           ee = eid.heatMode;
  //           cnom = eid.name;
  //           if (cnom == "Spa") {
  //             spaChil = cc;
  //             spaSetPt = eid.setPoint;
  //             spaCoolSetpt = eid.coolSetpoint;
  //             spaVals = spaSetPt.toString() + ", " + spaCoolSetpt.toString();
  //             $("#spaSlider").roundSlider("setValue", spaVals);
  //             $("#spaCurrentTemps").text(spaChil);
  //           }
  //           if (cnom == "Pool") {
  //             poolChil = cc;
  //             poolSetPts = eid.setPoint;
  //             poolCoolSetpt = eid.coolSetpoint;
  //             poolVals =
  //               poolSetPts.toString() + ", " + poolCoolSetpt.toString();
  //             $("#poolSlider").roundSlider("setValue", poolVals);
  //             $("#poolCurrentTemps").text(poolChil);
  //           }
  //           statusUpdate(aa, bb);
  //         });
  //       });
  //       $.each(heaters, function (i, hett) {
  //         var bID = hett.bodyId;
  //         var hID = hett.isOn;
  //         var isCool = hett.isCooling;
  //         makeChanges(bID, hID, isCool);
  //       });
  //       $("#poolCurrentTemps").text(poolChil);
  //       $("#poolSetTemps").text(poolSetPts + "° - " + poolCoolSetpt + "°F");
  //       $("#spaCurrentTemps").text(spaChil);
  //       $("#spaSetTemps").text(spaSetPt + "° - " + spaCoolSetpt + "°F");
  //     } catch (error) {
  //       console.error("Error processing status update:", error);
  //     }
  //   });
  // }

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
      $("#poolSetTemps").text(poolHeatTo + " - " + poolCoolTo + "° F");
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
      $("#spaSetTemps").text(spaHeatTo + " - " + spaCoolTo + "° F");
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
      url: "http://autopool.local:4200/state/body/heatMode",
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
      url: "http://autopool.local:4200/state/body/heatMode",
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
      $("#poOn").text(" Pool Off");
      $("#poolGauges").show();
    } else {
      data1 = {
        id: 6,
        state: false,
      };
      $("#poOn").text(" Pool On");
      $("#poolGauges").hide();
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
    // setTimeout(function () {
    //   $this.toggleClass("btn-info btn-circ");
    // }, 25000);
  });

  $("#spaCirculation").on("click", function (e) {
    e.preventDefault();
    var $this = $(this);
    var data;
    if ($this.hasClass("btn-info")) {
      $("#spaOn").text(" Spa Off");
      data = {
        id: 1,
        state: true,
      };
    } else {
      $("#spaOn").text(" Spa On");
      data = {
        id: 1,
        state: false,
      };
    }
    setPool(data);
    var elem = $("#spaDelay");
    cntdown(elem, $this);
    // setTimeout(function () {
    //   $this.toggleClass("btn-info btn-circ");
    // }, 25000);
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
      changeStuff("Pool Lights", true) 
    } else {
      data = {
        id: 7,
        state: false,
      };
      changeStuff("Pool Lights", false) 
    }
    // $("#poolLight").toggleClass("btn-info btn-warning");
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
      changeStuff("Spa Lights", true) 
    } else {
      data = {
        id: 8,
        state: false,
      };
      changeStuff("Spa Lights", false) 
    }
    // $(this).toggleClass("btn-info btn-warning");
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
      changeStuff("Aerator", true);
    } else {
      data = {
        id: 5,
        state: false,
      };
      changeStuff("Aerator", false);
    }
  // $(this).toggleClass("btn-info btn-circ");
    setPool(data);
  });

  $("#blowsHard").on("click", function (e) {
    e.preventDefault();
    var data;
    if ($(this).hasClass("btn-info")) {
      // $("#blowsHard").removeClass("btn-info")
      // $("#blowsHard").addClass("btn-circ");
      changeStuff("Blower", true);
      data = {
        id: 4,
        state: true,
      };
    } else {
      changeStuff("Blower", false);
      data = {
        id: 4,
        state: false,
      };
    }
    // $("#blowsHard").toggleClass("btn-info btn-light");
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
      changeStuff("Spa Jets", true);
    } else {
      data = {
        id: 3,
        state: false,
      };
      changeStuff("Spa Jets", false);
    }
    // $("#spaJets").toggleClass("btn-info btn-circ");
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

  function allState() {
    $.getJSON("http://autopool.local:4200/state/all", function (data) {
      parseAll(data);
    });
  }
  
  function parseAll(data) {
    // Parsing the circuits array from the JSON response
    const circuits = data.circuits;
  
    // Looping through each circuit and logging relevant information
    circuits.forEach(circuit => {
      var cName = circuit.name;
      var cState = circuit.isOn;
      changeStuff(cName, cState);
    });
  }

    function parseOne(msg) {
      // Ensure the message has the correct structure
      if (msg && msg.name && msg.isOn !== undefined) {
        const circuitName = msg.name;
        const circuitState = msg.isOn;
    
        // Call changeStuff with the extracted values
        changeStuff(circuitName, circuitState);
      } else {
        console.error("Invalid message format", msg);
      }
    }

  function changeStuff(data, status) {
    // Helper function to toggle classes
    function toggleClass(element, removeClass, addClass) {
      $(element).removeClass(removeClass).addClass(addClass);
    }
  
    switch (data) {
      case "Blower":
        toggleClass("#blowsHard", status ? "btn-info" : "btn-circ", status ? "btn-circ" : "btn-info");
        break;
  
      case "Aerator":
        toggleClass("#fount", status ? "btn-info" : "btn-circ", status ? "btn-circ" : "btn-info");
        break;
  
      case "Spa Jets":
      case "Spa jets":  // Handling case sensitivity
        $("#spaOn").text(status ? " Spa Off" : " Spa On");
        $("#poOn").text(status ? " Pool On" : " Pool Off");
        toggleClass("#spaJets", status ? "btn-info" : "btn-circ", status ? "btn-circ" : "btn-info");
        break;
  
      case "Pool Clean" || "Pool Cond":
      case "Pool cond" || "Pool clean":  // Handling case sensitivity
        $("#poOn").text(status ? " Pool Off" : " Pool On");
        $("#spaOn").text(status ? " Spa On" : " Spa Off");
        toggleClass("#poolCirculation", status ? "btn-info" : "btn-circ", status ? "btn-circ" : "btn-info");
        break;
  
      case "Spa Clean":
        console.log(data, status);
      // case "Spa clean": // Handling case sensitivity
        $("#spaOn").text(status ? " Spa Off" : " Spa On");
        toggleClass("#spaCirculation", status ? "btn-info" : "btn-circ", status ? "btn-circ" : "btn-info");
        break;
  
      case "Spa Light":
      case "Spa Lights":  // Handling plural
        toggleClass("#spaLight", status ? "btn-info" : "btn-light", status ? "btn-light" : "btn-info");
        break;
  
      case "Pool Light":
      case "Pool Lights":  // Handling plural
        toggleClass("#poolLight", status ? "btn-info" : "btn-light", status ? "btn-light" : "btn-info");
        break;
  
      default:
        console.warn(`Unhandled data type: ${data}`);
        break;
    }
  }
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
