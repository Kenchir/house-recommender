$( document ).ready(()=> {
    
    $( ".like-btn,.btn btn-primary btn-sm" ).each(function(index) {
        $(this).on("click", function(e){
              var target = $(e.target);
            if($(this).attr("class")===('like-btn')){
                $(this).removeClass('like-btn');
                $(this).addClass('btn btn-primary btn-sm');
                 var info={
                    houseid:$(this).attr('data'),
                    liked:false
                 }
            }
            else {
                 $(this).removeClass('btn btn-primary btn-sm');
                 $(this).addClass('like-btn');
                  var info={
                    houseid:$(this).attr('data'),
                    liked:true
                 }
            }
           console.log('Like house of id '+ $(this).attr('data') );
              
                        
                        console.log(info)
                        $.ajax({
                              url: '/house_like',
                              type: 'POST',
                              contentType: 'application/json',
                              dataType: 'json',
                              data: JSON.stringify(info),
                              complete: function() {
                                    console.log('Process completed!');
                              },
                              success: function() {
                                    ;
                              },
                              error: function() {
                                    console.log('Failed');
                              }
                        });
        });
    });
    
     $(".comment-div").each(function(index) {
       //  var comment1=  $("this.comment-cont").val();
         var m;
            $(this).children('.comment-cont').on('keyup',function(e) {
                 m=$(this).val()
                console.log(m);
            })
        $(this).children('.comment-btn').on('click',function(e) {
                   console.log("clicked")
                    //var comment=$(".comment-cont").val();   
                       // console.log("The comment is " + m)
                    var comment={
                         houseid:$(this).attr('data'),
                         text:m
                    }
                       console.log(comment)
                        $.ajax({
                              url: '/house_comment',
                              type: 'POST',
                              contentType: 'application/json',
                              dataType: 'json',
                              data: JSON.stringify(comment),
                              complete: function() {
                                    console.log('Process completed!');
                              },
                              success: function() {
                                    ;
                              },
                              error: function() {
                                    console.log('Failed');
                              }
                        });
             
                    
        });
    });
    
});
	
    
//     $('.like-btn').on('click',(e)=>{ 
//         e.preventDefault();
               
                
             
//             });
       

// 	function likePost(){
        
//         	     $(this).removeClass('.like-btn').addClass('btn btn-primary btn-sm');
//         		event.preventDefault();
        		
        	
//         	var info=$(".like-btn").val()
//                 $.ajax({
//                       url: '/house/like',
//                       type: 'POST',
//                       contentType: 'application/json',
//                       dataType: 'json',
//                       data: JSON.stringify({ id:$(this).attr('id') }),
//                       complete: function() {
//                             console.log('Process completed!');
//                       },
//                       success: function() {
//                             console.log('Successfully');
//                       },
//                       error: function() {
//                             console.log('Failed');
//                       }
//                 });
            	
         
//     }
    
  