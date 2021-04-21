import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet, TextInput, Image, ToastAndroid, Alert} from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as firebase from 'firebase';
import db from '../config'


export default class TransactionScreen extends React.Component {
    constructor(){
      super();
      this.state = {
        hasCameraPermissions: null,
        scanned: false,
        buttonState: 'normal' ,
        scannedBookId : '' ,
        scannedStudentId : '' ,
        transactionMessage : ''
      }
    }

    getCameraPermissions = async (id) =>{
      const {status} = await Permissions.askAsync(Permissions.CAMERA);
      
      this.setState({
        /*status === "granted" is true when user has granted permission
          status === "granted" is false when user has not granted the permission
        */
        hasCameraPermissions: status === "granted",
        buttonState: id,
        scanned: false
      });
    }

    handleBarCodeScanned = async({type, data})=>{
      const {buttonState} = this.state.buttonState
      if(buttonState === "BookId"){
        this.setState({
          scanned: true,
          scannedBookId: data,
          buttonState: 'normal'
        });
      }
      else if(buttonState === "StudentId"){
        this.setState({
          scanned: true,
          scannedStudentId: data,
          buttonState: 'normal'
        });
      }
      
    }

    initiateBookIssue = async()=>{
      db.collection("transactions").add({
        "studentId" : this.state.scannedStudentId,
        "bookId" : this.state.scannedBookId,
        "date": firebase.firestore.Timestamp.now().toDate(),
        "transactionType" :  "Issue"
      })
      db.collection("books").doc(this.state.scannedBookId).update({
        "bookAvailability" : false
      })
      db.collection("students").doc(this.state.scannedStudentId).update({
        "numberOfBooksIssued" : firebase.firestore.FieldValue.increment(1)
      })
      this.setState({
        scannedStudentId :'',
        scannedBookId : ''
      })
    }

    initiateBookReturn = async()=>{
      db.collection("transactions").add({
        "studentId" : this.state.scannedStudentId,
        "bookId" : this.state.scannedBookId,
        "date": firebase.firestore.Timestamp.now().toDate(),
        "transactionType" :  "Return"
      })
      db.collection("books").doc(this.state.scannedBookId).update({
        "bookAvailability" : true
      })
      db.collection("students").doc(this.state.scannedStudentId).update({
        "numberOfBooksIssued" : firebase.firestore.FieldValue.increment(-1)
      })
      this.setState({
        scannedStudentId :'',
        scannedBookId : ''
      })
    }


    checkBookEligibility = async()=>{

      const bookref = await db.collection("books").where("bookId", "==" , this.state.scannedBookId).get()  
      var transactionType = '';
      if(bookref.docs.length == 0){
        transactionType = false;

      }
      else {
        bookref.docs.map(doc=>{
          var book = doc.data()
          if(book.bookAvailability){
            transactionType = "Issue"
          }
          else{
            transactionType = "Return"
          }
        })
      }
      return transactionType
    }

    checkStudentEligibilityForBookIssue = async()=>{
      const studentref = await db.collection("students").where("studentId", "==", this.state.scannedStudentId).get()

      var isStudentEligible = '';
      if (studentref.docs.length == 0){
        isStudentEligible = false;
        this.setState({
          scannedStudentId:'',
          scannedBookId : '',
        })

        Alert.alert("this student Id doesnt exist in the database")

      }
      else{
        studentref.docs.map(doc=>{
          var student = doc.data()
          if(student.numberOfBooksIssued < 2){
            isStudentEligible = true;
          }
          else{
            isStudentEligible = false;
            Alert.alert("the student has already issued 2 books ")
            this.setState({
              scannedStudentId:'',
              scannedBookId : '',
            })

          }
        })
      }
      return isStudentEligible
    }

    checkStudentEligibilityForBookReturn = async()=>{
      const transactionref = await db.collection("transactions").where("bookId", "==", this.state.scannedBookId).limit(1).get()

      var isStudentEligible = '';
      
        transactionref.docs.map(doc=>{
          var lastBookTransaction = doc.data()
          console.log(lastBookTransaction)
          if(lastBookTransaction.studentId === this.state.scannedStudentId){
            isStudentEligible = true;

          }
          else{
            isStudentEligible = false;
            Alert.alert("the book was not issued by this student  ")
            this.setState({
              scannedStudentId:'',
              scannedBookId : '',
            })

          }
        })
      
      return isStudentEligible
    }

    handleTransaction = async()=>{
      var transactionType = await this.checkBookEligibility()
      if(!transactionType){
        Alert.alert("Book doesnt exist in the database");
        this.setState({
          scannedStudentId:'',
          scannedBookId : '',
        })
      }
      else if(transactionType == "Issue"){
        var isStudentEligible = await this.checkStudentEligibilityForBookIssue()
        if (isStudentEligible){
          this.initiateBookIssue()
          Alert.alert("Book issued to the student")
        }
        
      }
      else {
        var isStudentEligible = await this.checkStudentEligibilityForBookReturn()
        if (isStudentEligible){
          this.initiateBookReturn()
          Alert.alert("book returned to the library")
        }
      }
     
    }

    render() {
      const hasCameraPermissions = this.state.hasCameraPermissions;
      const scanned = this.state.scanned;
      const buttonState = this.state.buttonState;

      if (buttonState !== "normal" && hasCameraPermissions){
        return(
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        );
      }

      else if (buttonState === "normal"){
        return(
          <View style={styles.container}>
            <View>
              <Image 
              source ={require('../assets/booklogo.jpg')} 
              style = {{width : 200 , height : 200}}
               />
               <Text style = {{textAlign : 'center' , fontSize : 30}}>
                WILY
               </Text>
            </View>

            <View style = {styles.inputView}>
              <TextInput style = {styles.inputBox} 
              placeholder = "Book Id"
              onChangeText = {text=>this.setState({scannedBookId:text})}
              value = {this.state.scannedBookId} />

              <TouchableOpacity style = {styles.scanButton}
              onPress ={()=>{
                this.getCameraPermissions("BookId")
              }}>
                <Text style = {styles.buttonText}>
                  Scan
                </Text>

              </TouchableOpacity>

            </View>

            <View style = {styles.inputView}>
              <TextInput style = {styles.inputBox} 
              placeholder = "Student Id"
              onChangeText = {text=>this.setState({scannedStudentId:text})}
              value = {this.state.scannedStudentId} />

              <TouchableOpacity style = {styles.scanButton}
              onPress ={()=>{
                this.getCameraPermissions("StudentId")
              }}>
                <Text style = {styles.buttonText}>
                  Scan
                </Text>

              </TouchableOpacity>

            </View>

              <TouchableOpacity style = {styles.submitButton} 
                onPress ={async()=>{
                  var transactionMessage = await this.handleTransaction()
                }} >
              <Text style = {styles.submitButtonText}>
                Submit
              </Text>

              </TouchableOpacity>

          
        </View>
        );
      }
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    displayText:{
      fontSize: 15,
      textDecorationLine: 'underline'
    },
    scanButton:{
      backgroundColor: '#2196F3',
      //padding: 10,
      margin: 10 ,
      width : 100 ,
      borderWidth : 1.5,
      borderLeftWidth : 0 
    },
    buttonText:{
      fontSize: 20,
      textAlign : 'center' ,
      marginTop : 10 , 
    },
    inputView : {flexDirection : 'row',
    margin : 20
  },
  inputBox :{
    width : 200 ,
    height : 40 ,
    borderWidth : 1.5 ,
    fontSize : 20 , 
    borderRightWidth : 0
  },
  submitButtonText : {
    padding : 10,
    textAlign : 'center' , 
    fontSize : 20 ,
    fontWeight : 'bold',
    color : "white" , 
  },
  submitButton : {
    backgroundColor : "#fbc02d" , 
    width : 100 , 
    height : 50 ,
  }
  });