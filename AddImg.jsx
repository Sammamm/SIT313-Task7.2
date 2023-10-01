import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { getDocs, collection } from 'firebase/firestore'; // Import Firestore functions
import { v4 as uuidv4 } from 'uuid';
import { storage, db } from '../firebase'; // Replace with your Firebase configuration
import './AddImg.css';

function AddImg() {
  const [imageUpload, setImageUpload] = useState(null);
  const [imageList, setImageList] = useState([]);
  const [imageNames, setImageNames] = useState([]); // State to store image names

  const imageListRef = ref(storage, 'images/');

  const uploadImg = () => {
    if (imageUpload == null) return;
    const imageName = `${imageUpload.name}-${uuidv4()}`;
    const imgRef = ref(storage, `images/${imageName}`);

    uploadBytes(imgRef, imageUpload).then((snapshot) => {
      getDownloadURL(snapshot.ref).then((url) => {
        setImageList((prev) => [...prev, { url, name: imageName }]);
        setImageNames((prev) => [...prev, imageName]); // Add the image name to the array
      });
    });
  };

  const deleteImg = (imageName) => {
    const imgRef = ref(storage, `images/${imageName}`);

    deleteObject(imgRef)
      .then(() => {
        setImageList((prev) => prev.filter((img) => img.name !== imageName));
        setImageNames((prev) => prev.filter((name) => name !== imageName)); // Remove the image name from the array
      })
      .catch((error) => {
        console.error('Error deleting image:', error);
      });
  };

  useEffect(() => {
    // Fetch image names from Firestore 'images' collection
    const getImageNamesFromFirestore = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'images'));
        const names = querySnapshot.docs.map((doc) => doc.id);
        setImageNames(names);
      } catch (error) {
        console.error('Error fetching image names from Firestore:', error);
      }
    };

    listAll(imageListRef)
      .then((response) => {
        Promise.all(response.items.map((item) => getDownloadURL(item))).then((urls) => {
          setImageList(
            urls.map((url, index) => ({
              url,
              name: response.items[index].name.split('/')[1], // Extract the image name
            }))
          );
        });

        // Fetch image names from Firestore
        getImageNamesFromFirestore();
      })
      .catch((error) => {
        console.error('Error listing images:', error);
      });
  }, []);

  return (
    <div>
      <input
        type="file"
        onChange={(event) => {
          setImageUpload(event.target.files[0]);
        }}
      />
      <button onClick={uploadImg}>Upload</button>

      <div className="images">
        {imageList.map((image, index) => (
          <div key={index} className="image-container">
            <img className="upldedImg" src={image.url} alt={`Uploaded Image ${index}`} />
            <p>{imageNames[index]}</p> {/* Display the image name */}
            <button onClick={() => deleteImg(image.name)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AddImg;
