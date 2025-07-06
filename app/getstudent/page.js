"use client"
export default function getstudent() {


    async function get() {
        
        let data = {
            "id": "S001",
            "name": "Alice Smith",
            "class": 6,
            "section": "GOLAP",
            "roll": 1,
            "address": "123 Main St",
            "guardian": "John Smith",
            "contact": "123-456-7890",
            "tuitionFee": 500.00,
            "vehicleNo": "DH-A-1234",
            "vehicleFee": 150.00,
            "stationName": "Central Bus Stop",
            "dateOfBirth": "2010-05-15",
            "bloodGroup": "A+",
            "status": "active",
            "admissionMonth": "January"
        }
        
        
        const response = await fetch("http://localhost:3000/api/students", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }
    );
    
    let a = await response.json()
    
    console.log(a)
}
    


return <div>
    <button onClick={e=> {get() }}> click me </button>
</div>

}