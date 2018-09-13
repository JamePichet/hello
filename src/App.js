import React, { Component } from 'react';

//state leass component
// const App = () => (
//    <h1> Hello world </h1>
// )
class App extends Component {

  state = {
    notes: [
      'Note#1',
      'Note#2',
      'Note#3'
    ],
    value:''
  }

  componentDidMount() {
    this.noteInput.focus()
  }


  addNote = (e) => {
    if (e.key === 'Enter') {
      console.log(this)
      this.setState(
        { notes: [...this.state.notes, e.target.value],
          value:''
        },
        () => {
          this.noteInput.value = ''
          // const notes = this.state.notes
          //   console.log(notes.length);
          //  console.log(notes[notes.length - 1])
        }
      )
      // const notes = this.state.notes
      // console.log(notes[notes.length  - 1]);
    }
  }

  ChangeValue = (e) =>{
    this.setState({ value : e.target.value})
  }
 
  // constructor() {
  //   super()
  //   this.addNote = this.addNote.bind(this)
  // }
  render() {
    return (
      <div>
        <ul>
          {
            this.state.notes.map(
              (notes, index) => <li key={index}>{notes}</li>
            )
          }
        </ul>
        <input
          type="text"
          value={this.state.value}
          onChange={this.ChangeValue}
          onKeyUp={this.addNote}
          ref={input => this.noteInput = input}
        />
      </div>
      // e = event == Change
      // type =  type  == Change
      // target.value
      //onChange
      //
      //  <input type ='text' onKeyUp={(e) => { console.log(e.target.value)}}/>
    )
  }
}

// class App extends Component {
//   state = {
//     notes: ['Note#1']
//   }

//   render() {
//     return (
//       <div>
//         {this.state.notes.length > 0 ? <p>You have note </p> : <p>You have no  note </p>}
//       </div>
//     )
//   }
// }

export default App;
