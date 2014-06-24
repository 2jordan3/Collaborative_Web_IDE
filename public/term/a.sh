#!bin/sh

cat /etc/passwd | awk -F: '{print $1":"$3}' > ./test.txt

while read line; do
	#a=`cut -f1 -d":"`
	#if [ "$a"="user" ]; 
	#then
	#echo $line
	#getUid $a
	#fi
	a=`grep "$1"`
	echo $a|cut -f2 -d":" > test1.txt
	
done < ./test.txt

