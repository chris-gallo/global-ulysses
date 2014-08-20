<!DOCTYPE html><head>
  <meta charset="utf-8">
  <title> The Global Ulysses</title>
</head>

<?php

//to use $_GET["example"] or $_POST["example"] as $example
foreach(${"_" . $_SERVER["REQUEST_METHOD"]} as $k=>$v) $$k=$v;

?>

<style type="text/css">
path {
  stroke: white;
  stroke-width: 0.25px;
  fill: grey;
}

circle{
  fill:red;
  opacity: .6;
}

circle:hover {
  fill:blue;
}
</style>
<body onload="chart('<?php echo $episode; ?>','<?php echo $character; ?>')">
  <script src="http://d3js.org/d3.v3.min.js"></script>
  <script src="http://d3js.org/topojson.v0.min.js"></script>
  <script src = "script.js"></script>
  <p>
      <div id="charDrop"></div>
      <div id="epDrop"></div>
      <div id="map"></div>
  </p>
  <p id="map"></p>
  <table id = "geoInformation">
    <thead>
      <tr>
        <th> Locality </th>
        <th> Country </th>
        <th> Continent </th>
        <th> Character </th>
        <th> Episode </th>
        <th> Line </th>
        <th> Context </th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>
</body>
</html>
