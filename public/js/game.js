$(function () {
  $(document).ready(function(){
    let cols = $(".col");
    for (let x = 0; x < cols.length; x++) {
      for (let y = 0; y < 7; y++) {
        let square = document.createElement('div');
        // square.id = 'block';
        square.className = 'square';
        cols[x].appendChild(square) ;
      }
    }
  });
});